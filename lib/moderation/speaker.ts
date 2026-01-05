"use server";

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export interface ModerationResult {
  is_parliamentary: boolean;
  reason?: string;
  suggestion?: string;
  divergence_score: number; // 0-1 (higher means more toxic/unparliamentary)
}

/**
 * AI-Speaker checks if the text follows parliamentary standards.
 * Identifies hate speech, inappropriate language, and ad hominem attacks.
 */
export async function checkParliamentaryLanguage(text: string): Promise<ModerationResult> {
  try {
    const prompt = `Toimi parlamentaarisena puhemiehenä. Analysoi seuraava teksti, joka on tarkoitettu lakiesityksen muutosehdotukseksi tai perusteluksi.
    
    Teksti: "${text}"
    
    Tehtäväsi on:
    1. Tunnistaa asiaton kieli, vihapuhe tai henkilöön kohdistuvat hyökkäykset (ad hominem).
    2. Arvioida, noudattaako teksti sivistynyttä parlamentaarista keskustelutapaa.
    3. Jos teksti on epäasiallista, anna lyhyt perustelu ja ehdotus siitä, miten asian voisi ilmaista asiallisemmin.
    
    Vastaa JSON-muodossa: 
    { 
      "is_parliamentary": true/false, 
      "reason": "miksi asiaton", 
      "suggestion": "parempi sanamuoto",
      "divergence_score": 0.0-1.0 
    }`;

    const { text: resultText } = await generateText({
      model: openai("gpt-4o-mini") as any,
      prompt: prompt,
    });

    const cleanJson = resultText.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("AI Moderation failed:", error);
    // Fallback to allow if AI fails
    return { is_parliamentary: true, divergence_score: 0 };
  }
}

