import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import axios from "axios";

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
 * Analyzes speeches for a specific MP and updates their AI profile.
 */
export async function analyzeMPRhetoric(mpId: string | number, firstName: string, lastName: string, party: string) {
  console.log(`🧠 Analyzing rhetoric for: ${firstName} ${lastName} (${mpId})...`);

  // 1. Fetch speeches from Eduskunta API
  const API_URL = `https://avoindata.eduskunta.fi/api/v1/data/SaliPuheenvuoro`;
  let speeches = [];
  
  try {
    const response = await axios.get(API_URL, {
      params: {
        filter: `PuhujaHenkiloId eq ${mpId}`,
      }
    });

    if (response.data && response.data.rowData) {
      const columnNames = response.data.columnNames || [];
      const rowData = response.data.rowData || [];
      const contentIndex = columnNames.indexOf("SisaltoTeksti");
      const subjectIndex = columnNames.indexOf("AiheTeksti");
      const dateIndex = columnNames.indexOf("PuhevuoroPaivamaara");

      speeches = rowData.slice(0, 20).map((row: any) => ({
        date: row[dateIndex],
        subject: row[subjectIndex] || "Ei aihetta",
        content: row[contentIndex] || ""
      }));
    }
  } catch (err: any) {
    console.warn(`⚠️ Could not fetch speeches for ${mpId}:`, err.message);
  }

  if (speeches.length === 0) {
    console.log(`ℹ️ No speeches found for ${mpId}. Skipping profiling.`);
    return null;
  }

  const speechesContext = speeches.map((s: any) => `Aihe: ${s.subject}\nSisältö: ${s.content}`).join("\n\n---\n\n");

  try {
    const { text: profileJson } = await generateText({
      model: openai("gpt-4o-mini") as any,
      system: `Olet poliittisen viestinnän ja retoriikan asiantuntija. 
      Tehtäväsi on luoda 'Rhetoric Profile' annettujen puheiden perusteella.
      
      Analyysin on sisällettävä:
      1. Kielellinen tyyli: Lyhyet/pitkät lauseet, slangi, asiasanat, muodollisuus.
      2. Toistuvat teemat: 3–5 pääaihetta.
      3. Risteilypisteet (Conflict patterns): Mitä tai ketä henkilö tyypillisesti kritisoi.
      4. Tyypilliset aloitukset ja lopetukset.
      
      Palauta tiedot VAIN JSON-muodossa:
      {
        "linguistic_style": "string",
        "recurring_themes": ["string"],
        "conflict_patterns": "string",
        "openings_closings": "string"
      }`,
      prompt: `EDUSTAJAN ${firstName.toUpperCase()} ${lastName.toUpperCase()} PUHEET:\n\n${speechesContext}`
    });

    const rhetoricProfile: RhetoricProfile = JSON.parse(profileJson.replace(/```json\n?/, "").replace(/\n?```/, "").trim());

    const systemPrompt = `
      Olet kansanedustaja ${firstName} ${lastName}, puolueesi on ${party}.
      
      RETORIIKKA-PROFIILISI:
      - TYYLI: ${rhetoricProfile.linguistic_style}
      - TEEMAT: ${rhetoricProfile.recurring_themes.join(", ")}
      - KONFLIKTIT: ${rhetoricProfile.conflict_patterns}
      - PUHETAPA: ${rhetoricProfile.openings_closings}
      
      OHJEET VÄITTELYYN:
      1. Noudata omaa kielellistä tyyliäsi.
      2. Käytä referensseinä aiempia puheitasi ja teemojasi.
      3. ÄLÄ puhuttele vastustajaa 'puhemiehenä'. Jos väittelet toisen edustajan kanssa, käytä hänen nimeään tai sano 'kuule', 'kansanedustaja [Nimi]'.
      4. Jos kysymys liippaa läheltä kärkiteemojasi, mainitse että olet pitänyt aiheesta puheita eduskunnassa.
    `;

    const { error } = await supabase
      .from("mp_ai_profiles")
      .upsert({
        mp_id: mpId.toString(),
        rhetoric_style: rhetoricProfile,
        system_prompt: systemPrompt,
        updated_at: new Date().toISOString()
      }, { onConflict: 'mp_id' });

    if (error) throw error;

    console.log(`✅ Rhetoric Profile updated for ${lastName}.`);
    return rhetoricProfile;

  } catch (error: any) {
    console.error(`❌ Rhetoric Analysis failed for ${mpId}:`, error.message);
    return null;
  }
}

/**
 * Analyzes speeches from a JSON file and creates a rhetoric profile for Harry Harkimo.
 */
export async function analyzeHarkimoRhetoric() {
  return analyzeMPRhetoric(1140, "Harry", "Harkimo", "Liike Nyt");
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

