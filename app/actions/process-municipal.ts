"use server";

import { createClient } from "@/lib/supabase/server";
import { generateCitizenSummary } from "@/lib/ai-summary";
import { prepareBillTextForAI } from "@/lib/text-cleaner";
import { parseSummary } from "@/lib/summary-parser";

/**
 * Processes a municipal case to generate a citizen-friendly summary (selkokieli)
 */
export async function processMunicipalCaseToSelkokieli(caseId: string): Promise<{
  success: boolean;
  summary?: string;
  error?: string;
}> {
  const supabase = await createClient();

  try {
    const { data: municipalCase, error: caseError } = await supabase
      .from("municipal_cases")
      .select("*")
      .eq("id", caseId)
      .single();

    if (caseError || !municipalCase) {
      return { success: false, error: "Case not found" };
    }

    if (municipalCase.summary && municipalCase.summary.length > 500 && municipalCase.summary.includes("###")) {
      return { success: true, summary: municipalCase.summary };
    }

    const billText = municipalCase.raw_text || municipalCase.title;
    const preparedText = prepareBillTextForAI(billText);

    const summary = await generateCitizenSummary(preparedText, "municipal");

    if (!summary || summary.length < 50) {
      return { success: false, error: "Failed to generate summary" };
    }

    // Clean and save
    const cleanedSummary = summary.replace(/\u0000/g, '').trim();
    
    // AI Extraction for neighborhood and cost (mock for now, could be improved)
    let neighborhood = municipalCase.neighborhood;
    let costEstimate = municipalCase.cost_estimate;

    // Simple extraction logic from AI response
    const neighborhoodMatch = cleanedSummary.match(/kaupunginosaan ([^.\n]+)/i);
    if (neighborhoodMatch && !neighborhood) {
      neighborhood = neighborhoodMatch[1].trim();
    }

    const { error: updateError } = await supabase
      .from("municipal_cases")
      .update({
        summary: cleanedSummary,
        neighborhood,
        cost_estimate: costEstimate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", caseId);

    if (updateError) throw updateError;

    return { success: true, summary: cleanedSummary };
  } catch (error: any) {
    console.error("Failed to process municipal case:", error);
    return { success: false, error: error.message };
  }
}


