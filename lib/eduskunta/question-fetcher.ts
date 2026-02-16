import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

/**
 * lib/eduskunta/question-fetcher.ts
 * Fetches written questions from Eduskunta and maps them geographically.
 */

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export interface WrittenQuestion {
  id: string;
  mpId: string;
  title: string;
  date: string;
  parliamentId: string;
}

/**
 * Fetches latest written questions.
 */
export async function fetchWrittenQuestions(
  limit: number = 20,
): Promise<WrittenQuestion[]> {
  try {
    const url = `https://avoindata.eduskunta.fi/api/v1/tables/KirjallinenKysymys/rows?perPage=${limit}&page=0`;
    const response = await axios.get(url, { timeout: 15000 });

    if (!response.data || !response.data.rowData) return [];

    const columnNames = response.data.columnNames || [];
    const rowData = response.data.rowData || [];

    const idIndex = columnNames.indexOf("KirjallinenKysymysId");
    const mpIdIndex = columnNames.indexOf("HenkiloId");
    const dateIndex = columnNames.indexOf("Paivamaara");
    const titleIndex = columnNames.indexOf("OtsikkoTeksti");
    const tunnusIndex = columnNames.indexOf("EduskuntaTunnus");

    return rowData.map((row: any) => ({
      id: row[idIndex],
      mpId: row[mpIdIndex],
      title: row[titleIndex] || "Nimetön kysymys",
      date: row[dateIndex],
      parliamentId: row[tunnusIndex],
    }));
  } catch (error: any) {
    console.error("❌ Error fetching questions:", error.message);
    return [];
  }
}

/**
 * Analyzes question for local interest and tags it.
 */
export async function processQuestion(question: WrittenQuestion) {
  const supabase = getSupabase();
  console.log(`🔍 Processing question: ${question.title}`);

  try {
    const { text: geoJson } = await generateText({
      model: openai("gpt-4o-mini") as any,
      system: `Olet maantieteellisen datan asiantuntija. Tehtäväsi on tunnistaa kirjallisen kysymyksen otsikosta, koskeeko se jotain tiettyä Suomen kuntaa tai aluetta.
      
      Palauta tiedot VAIN JSON-muodossa:
      {
        "is_local_interest": boolean,
        "location": "Kunnan tai alueen nimi tai null",
        "tags": ["tag1", "tag2"]
      }`,
      prompt: `Kysymyksen otsikko: ${question.title}`,
    });

    const geoData = JSON.parse(
      geoJson
        .replace(/```json\n?/, "")
        .replace(/\n?```/, "")
        .trim(),
    );

    // Store in activity stream
    await supabase.from("mp_activity_stream").upsert(
      {
        mp_id: question.mpId,
        activity_type: "question",
        external_id: question.id,
        date: question.date,
        content_summary: question.title,
        metadata: {
          parliament_id: question.parliamentId,
          is_local_interest: geoData.is_local_interest,
          location: geoData.location,
          tags: geoData.tags,
        },
      },
      { onConflict: "external_id" },
    );

    return geoData;
  } catch (error: any) {
    console.error("❌ Question processing failed:", error.message);
    return null;
  }
}
