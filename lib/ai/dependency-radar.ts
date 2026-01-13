import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface ConflictAnalysis {
  score: number;
  explanation: string;
  detected_connections: {
    type: string;
    org: string;
    details: string;
  }[];
}

/**
 * Analyzes potential conflicts of interest between a bill and an MP.
 */
export async function analyzeConflicts(billId: string, mpId: string | number): Promise<ConflictAnalysis> {
  console.log(`📡 Dependency Radar: Analyzing conflicts for MP ${mpId} and Bill ${billId}...`);

  // 1. Fetch Bill Content
  const { data: bill } = await supabase
    .from("bills")
    .select("title, summary, raw_text")
    .eq("id", billId)
    .single();

  if (!bill) {
    throw new Error("Bill not found");
  }

  // 2. Fetch MP Dependencies and Meetings
  const [{ data: dependencies }, { data: meetings }] = await Promise.all([
    supabase
      .from("mp_dependencies")
      .select("*")
      .eq("mp_id", mpId),
    supabase
      .from("lobbyist_meetings")
      .select("*")
      .eq("mp_id", mpId)
  ]);

  const depsContext = (dependencies || []).map(d => `- ${d.category}: ${d.organization} (${d.description})`).join("\n");
  const meetingsContext = (meetings || []).map(m => `- ${m.meeting_date}: ${m.lobbyist_name} (${m.organization}) - Aihe: ${m.topic}`).join("\n");

  const prompt = `
    POLIITTINEN SIDONNAISUUS-TUTKA (Dependency Radar)
    
    TEHTÄVÄ:
    Arvioi onko kansanedustajalla eturistiriita tai merkittävä kytkös käsiteltävään lakiesitykseen.
    
    LAKIESITYS:
    Otsikko: ${bill.title}
    Tiivistelmä: ${bill.summary}
    
    EDUSTAJAN SIDONNAISUUDET:
    ${depsContext || "Ei ilmoitettuja sidonnaisuuksia."}
    
    TUOREIMMAT LOBBAUSTAPAAMISET:
    ${meetingsContext || "Ei tuoreita lobbaustapaamisia."}
    
    OHJEET:
    1. Laske 'Conflict Score' (0-100). 
       - 0: Ei mitään yhteyttä.
       - 50: Selkeä yhteys toimialaan tai järjestöön.
       - 100: Edustaja istuu suoraan laista hyötyvän yrityksen hallituksessa tai on tavannut sen edunvalvojia juuri ennen päätöstä.
    2. Kirjoita lyhyt, asiantunteva selitys tutkijalle.
    3. Listaa tunnistetut kytkökset.
    
    Palauta VAIN JSON muodossa:
    {
      "score": number,
      "explanation": "string",
      "detected_connections": [
        { "type": "Sidonnaisuus|Lobbaus", "org": "Organisaation nimi", "details": "miksi tämä on riski" }
      ]
    }
  `;

  try {
    const { text } = await generateText({
      model: openai("gpt-4o") as any,
      system: "Olet korruption ja poliittisen vaikuttamisen asiantuntija.",
      prompt: prompt
    });

    const result: ConflictAnalysis = JSON.parse(text.replace(/```json\n?/, "").replace(/\n?```/, "").trim());

    // Cache the result in mp_ai_profiles
    await supabase
      .from("mp_ai_profiles")
      .update({
        last_conflict_analysis: {
          [billId]: result,
          updated_at: new Date().toISOString()
        }
      })
      .eq("mp_id", mpId.toString());

    return result;
  } catch (error: any) {
    console.error("❌ Conflict Analysis failed:", error.message);
    return {
      score: 0,
      explanation: "Analyysi epäonnistui.",
      detected_connections: []
    };
  }
}

