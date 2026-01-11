import axios from "axios";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createClient } from "@supabase/supabase-js";

/**
 * lib/eduskunta/speech-parser.ts
 * Fetches and analyzes plenary speeches from Eduskunta Open Data.
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface EduskuntaSpeech {
  id: string;
  mpId: string;
  date: string;
  content: string;
  speakerName: string;
}

/**
 * Fetches latest plenary speeches from SaliPuhe table.
 */
export async function fetchLatestSpeeches(limit: number = 20): Promise<EduskuntaSpeech[]> {
  try {
    const url = `https://avoindata.eduskunta.fi/api/v1/tables/SaliPuhe/rows?perPage=${limit}&page=0`;
    const response = await axios.get(url, { timeout: 15000 });
    
    if (!response.data || !response.data.rowData) return [];

    const columnNames = response.data.columnNames || [];
    const rowData = response.data.rowData || [];

    const idIndex = columnNames.indexOf("SaliPuheId");
    const mpIdIndex = columnNames.indexOf("PuhujaHenkiloId");
    const dateIndex = columnNames.indexOf("PuhevuoroPaivamaara");
    const contentIndex = columnNames.indexOf("SisaltoTeksti");
    const speakerIndex = columnNames.indexOf("PuhujaSukuNimi"); // Might need first name too

    return rowData.map((row: any) => ({
      id: row[idIndex],
      mpId: row[mpIdIndex],
      date: row[dateIndex],
      content: row[contentIndex] || "",
      speakerName: row[speakerIndex] || "Tuntematon"
    }));
  } catch (error: any) {
    console.error("❌ Error fetching speeches:", error.message);
    return [];
  }
}

/**
 * Analyzes speech content using AI.
 */
export async function analyzeSpeech(speech: EduskuntaSpeech) {
  console.log(`🧠 Analyzing speech by ${speech.speakerName} (${speech.date})`);

  try {
    const { text: analysisJson } = await generateText({
      model: openai("gpt-4o-mini") as any,
      system: `Olet poliittinen analyytikko. Tehtäväsi on tiivistää kansanedustajan puhe ja tunnistaa sen pääteemat sekä asenne (sentiment).
      
      Analysoi puhe 6-akselisella DNA-mallilla (economy, values, environment, regional, international, security).
      Asteikko: -1.0 ... 1.0 (vaikutus akseliin).
      
      Palauta tiedot VAIN JSON-muodossa:
      {
        "themes": ["Teema 1", "Teema 2"],
        "sentiment": "positiivinen/negatiivinen/neutraali/aggressiivinen/sovitteleva",
        "dna_impact": {
          "economy": 0.0,
          "values": 0.0,
          "environment": 0.0,
          "regional": 0.0,
          "international": 0.0,
          "security": 0.0
        },
        "summary": "Lyhyt 1-2 virkkeen tiivistelmä puheen ytimestä."
      }`,
      prompt: `
        Puhuja: ${speech.speakerName}
        Päivämäärä: ${speech.date}
        Puheen sisältö: ${speech.content.substring(0, 5000)}
      `
    });

    const analysis = JSON.parse(analysisJson.replace(/```json\n?/, "").replace(/\n?```/, "").trim());

    // Update MP's activity stream and DNA in DB
    await storeSpeechAnalysis(speech, analysis);

    return analysis;
  } catch (error: any) {
    console.error("❌ Speech analysis failed:", error.message);
    return null;
  }
}

/**
 * Stores speech analysis and updates MP data.
 */
async function storeSpeechAnalysis(speech: EduskuntaSpeech, analysis: any) {
  // 1. Store in activity_stream table (need to create this if not exists)
  await supabase.from("mp_activity_stream").upsert({
    mp_id: speech.mpId,
    activity_type: "speech",
    external_id: speech.id,
    date: speech.date,
    content_summary: analysis.summary,
    metadata: {
      themes: analysis.themes,
      sentiment: analysis.sentiment,
      full_content: speech.content.substring(0, 1000)
    }
  }, { onConflict: "external_id" });

  // 2. Update MP DNA (weighted average or increment)
  // This is complex, for now let's just log it
  console.log(`📊 DNA Impact for MP ${speech.mpId}:`, analysis.dna_impact);
  
  // Potential: update_mp_dna_from_activity(mp_id, dna_impact)
}

