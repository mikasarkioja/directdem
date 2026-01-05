"use server";

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Uses AI to split a bill into 5-10 micro-tasks for collaborative analysis.
 */
export async function generateBillTasks(billId: string, billTitle: string, billSummary: string) {
  const supabase = await createClient();

  // Check if tasks already exist
  const { data: existingTasks } = await supabase
    .from('bill_tasks')
    .select('id')
    .eq('bill_id', billId);

  if (existingTasks && existingTasks.length > 0) return { success: true, message: "Tasks already exist" };

  try {
    const prompt = `Toimi parlamentaarisena koordinaattorina. Pilko seuraava lakiesitys 5-10 pieneen, konkreettiseen analyysitehtävään, joita vapaaehtoiset "Varjokansanedustajat" voivat suorittaa.
    
    Otsikko: ${billTitle}
    Tiivistelmä: ${billSummary}
    
    Tehtävien tulee liittyä esimerkiksi:
    - Taloudellisten vaikutusten arviointiin
    - Perusoikeusvaikutusten tarkistamiseen
    - Ympäristövaikutusten analysointiin
    - Vertaamiseen muiden maiden vastaavaan lainsäädäntöön
    - Sidosryhmien (kuten järjestöjen) lausuntojen tiivistämiseen
    
    Vastaa JSON-muodossa: { "tasks": [{ "title": "tehtävän otsikko", "description": "lyhyt kuvaus mitä pitää tehdä" }] }`;

    const { text } = await generateText({
      model: openai("gpt-4o-mini") as any,
      prompt: prompt,
    });

    const cleanJson = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(cleanJson);

    if (result.tasks && Array.isArray(result.tasks)) {
      const tasksToInsert = result.tasks.map((t: any) => ({
        bill_id: billId,
        title: t.title,
        description: t.description,
        status: 'todo'
      }));

      const { error } = await supabase.from('bill_tasks').insert(tasksToInsert);
      if (error) throw error;
    }

    revalidatePath('/workspace');
    return { success: true };
  } catch (error) {
    console.error("Failed to generate bill tasks:", error);
    return { success: false, error: "Tehtävien generointi epäonnistui" };
  }
}

/**
 * Assigns a task to a user.
 */
export async function assignTask(taskId: string, userId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('bill_tasks')
    .update({ assigned_to: userId, status: 'in_progress' })
    .eq('id', taskId);

  if (error) return { success: false, error: error.message };
  revalidatePath('/workspace');
  return { success: true };
}

/**
 * Submits a proposed amendment/edit to a bill section.
 */
export async function submitAmendment(billId: string, sectionTitle: string, proposedText: string, userId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('bill_amendments')
    .insert({
      bill_id: billId,
      section_title: sectionTitle,
      proposed_text: proposedText,
      author_id: userId,
      status: 'pending'
    });

  if (error) return { success: false, error: error.message };
  revalidatePath('/workspace');
  return { success: true };
}

/**
 * Votes on an amendment. If >60% support and enough votes, marks as accepted.
 */
export async function voteAmendment(amendmentId: string, userId: string, voteType: 'pro' | 'con') {
  const supabase = await createClient();
  
  // 1. Record the vote
  const { error: voteError } = await supabase
    .from('amendment_votes')
    .upsert({ amendment_id: amendmentId, user_id: userId, vote_type: voteType });

  if (voteError) return { success: false, error: voteError.message };

  // 2. Count votes and update amendment
  const { data: votes } = await supabase
    .from('amendment_votes')
    .select('vote_type')
    .eq('amendment_id', amendmentId);

  if (votes) {
    const pros = votes.filter(v => v.vote_type === 'pro').length;
    const cons = votes.filter(v => v.vote_type === 'con').length;
    const total = pros + cons;
    const supportRate = pros / total;

    let status = 'pending';
    if (total >= 5 && supportRate >= 0.6) {
      status = 'accepted';
      
      // Award expertise points to the author
      const { data: amendment } = await supabase
        .from('bill_amendments')
        .select('author_id')
        .eq('id', amendmentId)
        .single();
        
      if (amendment) {
        await supabase.rpc('increment_expertise_points', { user_id: amendment.author_id, amount: 50 });
      }
    } else if (total >= 5 && supportRate < 0.3) {
      status = 'rejected';
    }

    await supabase
      .from('bill_amendments')
      .update({ votes_for: pros, votes_against: cons, status })
      .eq('id', amendmentId);
  }

  revalidatePath('/workspace');
  return { success: true };
}

