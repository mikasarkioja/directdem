"use server";

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

/**
 * Generates two conflicting expert opinions for a bill.
 */
export async function getExpertOpinions(billTitle: string, billSummary: string) {
  try {
    const prompt = `Olet parlamentaarinen analyytikko. Luo kaksi vastakkaista asiantuntijalausuntoa seuraavasta lakiesityksestä:
    
    Otsikko: ${billTitle}
    Tiivistelmä: ${billSummary}
    
    Luo:
    1. PRO-lausunto: Asiantuntija, joka puolustaa esitystä perustellen sen hyötyjä (talous, yhteiskunta, tms).
    2. CON-lausunto: Asiantuntija, joka vastustaa esitystä nostaen esiin riskejä, kustannuksia tai muita ongelmia.
    
    Vastaa JSON-muodossa: { "pro": "lausunto", "con": "lausunto" }. Käytä asiantuntevaa ja virallista kieltä.`;

    const { text } = await generateText({
      model: openai("gpt-4o-mini") as any,
      prompt: prompt,
    });

    // Handle potential JSON parsing from AI text
    const cleanJson = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Expert opinion generation failed:", error);
    return {
      pro: "Esityksen tavoitteet ovat linjassa yhteiskunnallisen kehityksen kanssa.",
      con: "Esityksen vaikutukset vaativat vielä tarkempaa analyysia ja riskien arviointia."
    };
  }
}


