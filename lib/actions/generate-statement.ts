"use server";

import { createClient } from "@supabase/supabase-js";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { revalidatePath } from "next/cache";

/**
 * Saves a shadow MP statement to the database.
 */
export async function submitShadowStatement(data: {
  billId: string;
  userId: string;
  voteType: 'jaa' | 'ei' | 'tyhjaa';
  justification: string;
  focusArea: string;
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase.from("bill_user_submissions").insert({
    bill_id: data.billId,
    user_id: data.userId,
    vote_type: data.voteType,
    justification: data.justification,
    focus_area: data.focusArea
  });

  if (error) {
    console.error("Error submitting shadow statement:", error);
    throw new Error("Lausunnon tallennus epäonnistui.");
  }

  revalidatePath(`/lausunnot/${data.billId}`);
  return { success: true };
}

/**
 * Generates an official AI summary from all user submissions for a bill.
 */
export async function generateShadowParliamentStatement(billId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Fetch bill info
  const { data: bill } = await supabase
    .from("bills")
    .select("title, category")
    .eq("id", billId)
    .single();

  if (!bill) throw new Error("Lakiesitystä ei löytynyt.");

  // 2. Fetch all submissions
  const { data: submissions, error } = await supabase
    .from("bill_user_submissions")
    .select("*")
    .eq("bill_id", billId);

  if (error || !submissions || submissions.length === 0) {
    return {
      summary: "Ei tarpeeksi lausuntoja analyysin tekemiseen.",
      submissions: []
    };
  }

  // 3. Prepare data for AI
  const submissionsText = submissions
    .map(s => `- Kanta: ${s.vote_type}, Alue: ${s.focus_area}, Perustelu: ${s.justification}`)
    .join("\n");

  const prompt = `Olet Kansan Varjoeduskunnan virallinen sihteeri. Tehtäväsi on laatia tiivistetty ja asiantunteva lausunto lakiesityksestä "${bill.title}" kansalaisten antamien vastausten perusteella.

Kansalaisten vastaukset:
${submissionsText}

Laadi lausunto seuraavassa muodossa:
1. KONSENSUS: Missä asioissa kansalaiset ovat pääosin samaa mieltä?
2. JAKOLINJAT: Mitkä asiat herättävät eniten erimielisyyttä?
3. HUOLENAIHEET: Mitkä ovat kriittisimmät esiin nousseet riskit tai parannusehdot?

Kirjoita sivistyneellä, neutraalilla ja virallisella suomen kielellä.`;

  try {
    const { text } = await generateText({
      model: openai("gpt-4o") as any,
      prompt: prompt,
    });

    return {
      summary: text,
      submissions: submissions.map(s => ({
        text: s.justification,
        sentiment: s.vote_type
      }))
    };
  } catch (e) {
    console.error("AI generation failed:", e);
    return {
      summary: "Lausunnon generointi epäonnistui. Kansan tahto on kuitenkin tallennettu.",
      submissions: submissions.map(s => ({
        text: s.justification,
        sentiment: s.vote_type
      }))
    };
  }
}


