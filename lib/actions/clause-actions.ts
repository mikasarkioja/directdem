"use server";

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { checkParliamentaryLanguage } from "@/lib/moderation/speaker";

/**
 * Uses AI to format a proposal into professional legal language.
 */
export async function formatLegalLanguage(text: string) {
  try {
    const prompt = `Toimi parlamentaarisena lainsäädäntösihteerinä. Muotoile seuraava kansalaisen ehdotus ammattimaiseksi, täsmälliseksi ja viralliseksi suomalaiseksi lakikieleksi. Säilytä alkuperäinen asiasisältö, mutta varmista juridinen tyyli:
    
    Ehdotus: ${text}
    
    Palauta vain muotoiltu lakiteksti ilman selityksiä.`;

    const { text: formattedText } = await generateText({
      model: openai("gpt-4o"),
      prompt: prompt,
    } as any);

    return formattedText.trim();
  } catch (error) {
    console.error("AI Legal formatting failed:", error);
    return text;
  }
}

/**
 * Splits a bill into sections if they don't exist yet (Mock logic for demo).
 */
export async function ensureBillSections(billId: string, fullText: string) {
  const supabase = await createClient();
  
  const { data: existing } = await supabase.from('bill_sections').select('id').eq('bill_id', billId).limit(1);
  if (existing && existing.length > 0) return;

  // Simple regex to find § symbols or "X pykälä" (very basic for demo)
  const sections = fullText.split(/(?=\d+\s*§)/).filter(s => s.trim().length > 20).slice(0, 5);
  
  const toInsert = sections.map((content, i) => ({
    bill_id: billId,
    section_number: `${i + 1} §`,
    title: content.split('\n')[0].substring(0, 50).trim() || "Nimetön pykälä",
    content: content.trim(),
    order_index: i
  }));

  if (toInsert.length > 0) {
    await supabase.from('bill_sections').insert(toInsert);
  }
}

/**
 * Submits a detailed amendment for a specific section.
 */
export async function proposeSectionEdit(
  sectionId: string, 
  billId: string, 
  proposedText: string, 
  justification: string, 
  userId: string,
  sectionTitle: string
) {
  const supabase = await createClient();

  // 1. Check User Trust Score
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('trust_score')
    .eq('id', userId)
    .single();

  if (!userProfile || (userProfile.trust_score || 0) < 30) {
    return { 
      success: false, 
      error: "Luottamusindeksisi on liian alhainen (alle 30). Osallistu muihin tehtäviin nostaaksesi sitä." 
    };
  }

  // 2. AI Moderation Check
  const modCheck = await checkParliamentaryLanguage(proposedText + " " + justification);
  if (!modCheck.is_parliamentary) {
    // Punish user's trust score for unparliamentary behavior
    await supabase.rpc('decrement_trust_score', { user_id: userId, amount: 10 });
    
    return { 
      success: false, 
      error: `Puhemies on hylännyt ehdotuksesi epäasiallisen kielen vuoksi. Syy: ${modCheck.reason}. Ehdotus: ${modCheck.suggestion}`,
      is_moderated: true
    };
  }
  
  const { error } = await supabase.from('bill_amendments').insert({
    section_id: sectionId,
    bill_id: billId,
    section_title: sectionTitle,
    proposed_text: proposedText,
    justification: justification,
    author_id: userId,
    status: 'pending'
  });

  if (error) throw error;
  revalidatePath('/workspace');
  return { success: true };
}

/**
 * Updated vote logic with auto-acceptance.
 */
export async function voteSectionAmendment(amendmentId: string, userId: string, voteType: 'pro' | 'con') {
  const supabase = await createClient();
  
  await supabase.from('amendment_votes').upsert({ amendment_id: amendmentId, user_id: userId, vote_type: voteType });

  const { data: votes } = await supabase.from('amendment_votes').select('vote_type').eq('amendment_id', amendmentId);
  if (!votes) return;

  const pros = votes.filter(v => v.vote_type === 'pro').length;
  const cons = votes.filter(v => v.vote_type === 'con').length;
  const total = pros + cons;
  const supportRate = pros / total;

  // Auto-acceptance logic: 60% support and min 20 votes (reduced to 5 for demo)
  if (total >= 5 && supportRate >= 0.6) {
    const { data: amendment } = await supabase.from('bill_amendments').update({ status: 'accepted' }).eq('id', amendmentId).select().single();
    
    if (amendment && amendment.section_id) {
      // Update the bill section's current shadow text
      await supabase.from('bill_sections')
        .update({ current_shadow_text: amendment.proposed_text })
        .eq('id', amendment.section_id);
    }
  }

  revalidatePath('/workspace');
}

