import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * AI Engine to find correlations between MP interests and political speeches.
 */
export async function analyzeInterestCorrelations(mpId: string | number) {
  console.log(`🧠 Correlation Engine: Analyzing MP ${mpId}...`);

  // 1. Fetch Dependency History
  const { data: history } = await supabase
    .from("mp_dependency_history")
    .select("*")
    .eq("mp_id", mpId)
    .order("detected_at", { ascending: true });

  // 2. Fetch recent speeches (from a hypothetical speeches table or sync)
  // We'll search for speeches for this MP
  // For the sake of this logic, let's assume we have them or fetch them from the Eduskunta API context
  const { data: aiProfile } = await supabase
    .from("mp_ai_profiles")
    .select("rhetoric_style, system_prompt")
    .eq("mp_id", mpId.toString())
    .single();

  // Simulate speech data (In production, this would be a join with a speeches table)
  const sampleSpeeches = [
    { id: "S1", date: "2025-11-25", topic: "Energiapolitiikka", content: "Meidän on tuettava kotimaista energiantuotantoa..." },
    { id: "S2", date: "2025-12-10", topic: "Yritysverotus", content: "Pienten yritysten verotaakkaa on kevennettävä välittömästi..." }
  ];

  const historyContext = (history || []).map(h => 
    `[${h.detected_at}] ${h.change_type}: ${h.organization} (${h.description})`
  ).join("\n");

  const speechContext = sampleSpeeches.map(s => 
    `[${s.date}] Aihe: ${s.topic}\nSisältö: ${s.content}`
  ).join("\n\n");

  const prompt = `
    KORRELAATIO-ANALYYSI (Interest vs. Action)
    
    TEHTÄVÄ:
    Etsi yhteyksiä kansanedustajan sidonnaisuuksien muutosten ja hänen puheidensa välillä.
    
    SIDONNAISUUS-HISTORIA:
    ${historyContext || "Ei merkittäviä muutoksia historiassa."}
    
    VIIMEISIMMÄT PUHEET:
    ${speechContext}
    
    OHJEET:
    1. Tunnista ajoitukselliset korrelaatiot (esim. puheenvuoro tietystä aiheesta pian hallituspaikan alkamisen jälkeen).
    2. Arvioi merkitys (Significance Score 0-100).
    3. Perustele korrelaatio tutkijalle.
    
    Palauta lista JSON-muodossa:
    [
      {
        "speech_id": "string",
        "dependency_desc": "string",
        "score": number,
        "reasoning": "string",
        "theme": "Energia|Talous|Sote|tms"
      }
    ]
  `;

  try {
    const { text } = await generateText({
      model: openai("gpt-4o") as any,
      system: "Olet poliittisen analytiikan ja korruptiontutkimuksen AI-moottori.",
      prompt: prompt
    });

    const correlations = JSON.parse(text.replace(/```json\n?/, "").replace(/\n?```/, "").trim());

    // 4. Save correlations to DB
    for (const corr of correlations) {
      await supabase.from("mp_interest_correlations").insert({
        mp_id: mpId,
        speech_id: corr.speech_id,
        significance_score: corr.score,
        correlation_reasoning: corr.reasoning,
        theme: corr.theme
      });
    }

    return correlations;
  } catch (error: any) {
    console.error("❌ Correlation analysis failed:", error.message);
    return [];
  }
}

