import { createClient } from "@supabase/supabase-js";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function analyzeAndEnhanceBill(billId: string) {
  console.log(`--- Syväanalysoidaan lakiesitys: ${billId} ---`);

  // 1. Hae lakiesityksen perustiedot
  const { data: bill, error: billError } = await supabase
    .from("bills")
    .select("*")
    .eq("id", billId)
    .single();

  if (billError || !bill) throw new Error("Lakiesitystä ei löydy");

  const sourceText = bill.summary || bill.title || "Ei kuvausta saatavilla.";

  // 2. AI Analyysi
  const { text: analysisText } = await generateText({
    model: openai("gpt-4o") as any,
    system: `Olet edistynyt lainsäädännön analyytikko ja poliittinen strategi. 
    Tehtäväsi on purkaa lakiesitys osiin ja tunnistaa sen ideologiset jännitteet, voittajat ja häviäjät.`,
    prompt: `
      Analysoi tämä lakiesitys:
      Otsikko: ${bill.title}
      Tiivistelmä: ${sourceText}
      
      Tehtävät:
      1. Tunnista 3 "kuuminta" kohtaa (hotspots).
      2. Määritä vaikutusaste (0.0 - 1.0) kuudelle DNA-akselillemme:
         - Talous (Economy)
         - Arvot (Values)
         - Ympäristö (Environment)
         - Alueellisuus (Regional/Urban-Rural)
         - Kansainvälisyys (International)
         - Turvallisuus (Security)
      3. Tunnista sidosryhmät: Ketkä ovat "Voittajia" (Winners) ja ketkä "Häviäjiä" (Losers).
      4. Arvioi monimutkaisuus (1-10) ja äänestäjien herkkyys (Low/High).
      
      Vastaa VAIN tässä JSON-muodossa:
      {
        "category": "",
        "complexity_score": 5,
        "dna_impact_vector": {
          "economy": 0.0,
          "values": 0.0,
          "environment": 0.0,
          "regional": 0.0,
          "international": 0.0,
          "security": 0.0
        },
        "analysis_data": {
          "simple_summary": "",
          "hotspots": [
            {"clause": "pykälän/kohdan kuvaus", "issue": "miksi kiistanalainen", "tension_level": 8}
          ],
          "winners": ["eläkeläiset", "yrittäjät"],
          "losers": ["opiskelijat"],
          "ideological_tradeoffs": "Esim. valtion velka vs. sosiaaliturva"
        },
        "voter_sensitivity": "High"
      }
    `,
  } as any);

  const analysisRaw = analysisText.replace(/```json\n?/, '').replace(/\n?```/, '').trim();
  const analysis = JSON.parse(analysisRaw);

  // 3. Tallenna laajennettu profiili
  const { error: upsertError } = await supabase
    .from("bill_enhanced_profiles")
    .upsert({
      bill_id: billId,
      title: bill.title,
      category: analysis.category,
      complexity_score: analysis.complexity_score,
      dna_impact_vector: analysis.dna_impact_vector,
      analysis_data: analysis.analysis_data,
      forecast_metrics: {
        friction_index: 0, // Lasketaan myöhemmin forecast-enginellä
        party_alignment_prediction: {},
        voter_sensitivity: analysis.voter_sensitivity,
        precedent_bill_id: ""
      },
      updated_at: new Date().toISOString()
    });

  if (upsertError) {
    console.error("Virhe tallennettaessa laajennettua lakiprofiilia:", upsertError.message);
    throw upsertError;
  }

  return analysis;
}

