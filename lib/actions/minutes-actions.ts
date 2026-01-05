"use server";

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Generates the Shadow Minutes (Varjopöytäkirja) analysis.
 */
export async function generateShadowMinutesAnalysis(billId: string) {
  const supabase = await createClient();

  // 1. Fetch all data
  const { data: bill } = await supabase.from('bills').select('*').eq('id', billId).single();
  const { data: sections } = await supabase.from('bill_sections').select('*').eq('bill_id', billId).order('order_index');
  const { data: amendments } = await supabase.from('bill_amendments')
    .select('proposed_text, justification, section_title')
    .eq('bill_id', billId)
    .eq('status', 'accepted');

  if (!bill || !sections) return null;

  try {
    // 2. Prepare context for AI
    const shadowChanges = sections
      .filter(s => s.current_shadow_text)
      .map(s => `Pykälä ${s.section_number}: ${s.current_shadow_text}\nPerustelut: ${amendments?.filter(a => a.section_title === s.section_number).map(a => a.justification).join('; ')}`)
      .join('\n\n');

    const realText = sections.map(s => `Pykälä ${s.section_number}: ${s.real_final_text || s.content}`).join('\n\n');

    const prompt = `Toimi parlamentaarisena analyytikkona. Luo "Varjopöytäkirjan" analyysi seuraavasta lakiesityksestä:
    
    Laki: ${bill.title}
    
    VARJOEDUSKUNNAN MUUTOKSET JA PERUSTELUT:
    ${shadowChanges}
    
    EDUSKUNNAN LOPULLINEN TEKSTI:
    ${realText}
    
    TEHTÄVÄT:
    1. Tiivistä kansan perustelut "Kansan perustelumuistioksi" (serif-tyylinen, virallinen).
    2. Analysoi "Demokratia-vaje": Miten kansa ja eduskunta eräsivät ideologisesti? Mitä kansa painotti, mitä eduskunta sivuutti?
    3. Anna "Eroavaisuus-indeksi" (0-100), missä 100 on täydellinen vastaavuus ja 0 on täydellinen ero.
    
    Vastaa JSON-muodossa: { "summary_memo": "teksti", "ideological_divergence": "teksti", "democracy_gap_score": 0-100 }`;

    const { text } = await generateText({
      model: openai("gpt-4o") as any,
      prompt: prompt,
    });

    const cleanJson = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(cleanJson);

    // 3. Cache the analysis
    await supabase.from('bill_minutes_analysis').upsert({
      bill_id: billId,
      summary_memo: result.summary_memo,
      ideological_divergence: result.ideological_divergence,
      democracy_gap_score: result.democracy_gap_score
    });

    revalidatePath(`/poytakirjat/${billId}`);
    return result;
  } catch (error) {
    console.error("Shadow Minutes generation failed:", error);
    return null;
  }
}

/**
 * Fetches existing minutes or generates if missing.
 */
export async function getShadowMinutes(billId: string) {
  const supabase = await createClient();
  const { data: analysis } = await supabase.from('bill_minutes_analysis').select('*').eq('bill_id', billId).single();
  
  if (analysis) return analysis;
  return await generateShadowMinutesAnalysis(billId);
}

