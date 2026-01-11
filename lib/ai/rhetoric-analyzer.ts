import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

/**
 * lib/ai/rhetoric-analyzer.ts
 * Analyzes MP speeches to create a rhetoric profile and update system prompts.
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface RhetoricProfile {
  linguistic_style: string;
  recurring_themes: string[];
  conflict_patterns: string;
  openings_closings: string;
}

/**
 * Analyzes speeches from a JSON file and creates a rhetoric profile for Harry Harkimo.
 */
export async function analyzeHarkimoRhetoric() {
  console.log("🧠 Käynnistetään Harry Harkimo 2025 Rhetoric Analysis...");

  const filePath = path.join(process.cwd(), "data", "harkimo_speeches_2025.json");
  if (!fs.existsSync(filePath)) {
    throw new Error("Puhedataa ei löytynyt. Aja fetch-skripti ensin.");
  }

  const speeches = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const speechesContext = speeches.map((s: any) => `Päivämäärä: ${s.date}\nAihe: ${s.subject}\nSisältö: ${s.content}`).join("\n\n---\n\n");

  try {
    const { text: profileJson } = await generateText({
      model: openai("gpt-4o") as any,
      system: `Olet poliittisen viestinnän ja retoriikan asiantuntija. 
      Tehtäväsi on luoda 'Harry Harkimo 2025 Rhetoric Profile' annettujen puheiden perusteella.
      
      Analyysin on sisällettävä:
      1. Kielellinen tyyli: Lyhyet/pitkät lauseet, slangi, liikemiestermit, muodollisuus.
      2. Toistuvat teemat: 3–5 pääaihetta.
      3. Risteilypisteet (Conflict patterns): Kritiikin kohteet ja vastaustyyli.
      4. Tyypilliset aloitukset ja lopetukset.
      
      Palauta tiedot VAIN JSON-muodossa:
      {
        "linguistic_style": "string",
        "recurring_themes": ["string"],
        "conflict_patterns": "string",
        "openings_closings": "string"
      }`,
      prompt: `HARRY HARKIMON PUHEET 2025:\n\n${speechesContext}`
    });

    const rhetoricProfile: RhetoricProfile = JSON.parse(profileJson.replace(/```json\n?/, "").replace(/\n?```/, "").trim());

    // Update Supabase
    // Harkimo's MP ID in our DB is 1328
    const mpId = 1328;

    const systemPrompt = `
      Olet Harry 'Hjallis' Harkimo, Liike Nytin puheenjohtaja ja kansanedustaja.
      
      RETORIIKKA-PROFIILISI (2025):
      - TYYLI: ${rhetoricProfile.linguistic_style}
      - TEEMAT: ${rhetoricProfile.recurring_themes.join(", ")}
      - KONFLIKTIT: ${rhetoricProfile.conflict_patterns}
      - PUHETAPA: ${rhetoricProfile.openings_closings}
      
      OHJEET VÄITTELYYN:
      1. Puhu suoraan, vältä 'poliittista jargonia'.
      2. Käytä lyhyitä, iskeviä lauseita.
      3. Haasta vanhat puolueet ja byrokratia.
      4. Tuo esiin yrittäjyyden ja talouden näkökulma.
      5. ÄLÄ puhuttele vastustajaa 'puhemiehenä'. Jos väittelet toisen edustajan kanssa, käytä hänen nimeään tai sano 'kuule', 'sä' (Hjalliksen tyyli) tai 'kansanedustaja [Nimi]'.
      6. Käytä iskeviä aloituksia kuten 'Kuulkaa nyt!', 'Mä en ymmärrä...' tai 'Nyt on ihan pakko sanoa...'.
    `;

    const { error } = await supabase
      .from("mp_ai_profiles")
      .upsert({
        mp_id: mpId,
        rhetoric_style: rhetoricProfile,
        system_prompt: systemPrompt,
        updated_at: new Date().toISOString()
      }, { onConflict: 'mp_id' });

    if (error) throw error;

    console.log("✅ Rhetoric Profile tallennettu ja System Prompt päivitetty!");
    return rhetoricProfile;

  } catch (error: any) {
    console.error("❌ Rhetoric Analysis failed:", error.message);
    return null;
  }
}

/**
 * Generates example responses based on the profile.
 */
export async function generateExampleHarkimoResponses(question: string) {
  // Fetch the latest system prompt
  const { data: profile } = await supabase
    .from("mp_ai_profiles")
    .select("system_prompt")
    .eq("mp_id", 1328)
    .single();

  if (!profile) return [];

  const { text: responsesJson } = await generateText({
    model: openai("gpt-4o") as any,
    system: profile.system_prompt,
    prompt: `Kansalainen kysyy sinulta: "${question}"
    
    Anna 3 erilaista, lyhyttä vastausta, jotka heijastavat retoriikkaasi. 
    Vastaa VAIN JSON-listana merkkijonoja.`
  });

  return JSON.parse(responsesJson.replace(/```json\n?/, "").replace(/\n?```/, "").trim());
}

