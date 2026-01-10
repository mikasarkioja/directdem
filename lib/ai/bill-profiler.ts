import { createClient } from "@supabase/supabase-js";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function profileBill(billId: string) {
  console.log(`--- Profiloidaan lakiesitys: ${billId} ---`);

  // 1. Hae lakiesityksen tiedot
  const { data: bill, error: billError } = await supabase
    .from("bills")
    .select("*")
    .eq("id", billId)
    .single();

  if (billError || !bill) throw new Error("Lakiesitystä ei löydy");

  // 2. Käytä AI:ta analysoimaan hotspots ja vaikutukset
  // Käytetään summarya tai koko tekstiä jos saatavilla
  const sourceText = bill.summary || bill.title || "Ei kuvausta saatavilla.";

  const { text: analysisText } = await generateText({
    model: openai("gpt-4o-mini") as any,
    system: "Olet poliittinen strategisti. Tehtäväsi on analysoida lakiesitystekstiä ja löytää siitä poliittiset kiistakapulat (hotspots).",
    prompt: `
      Lakiesitys: ${bill.title}
      Teksti: ${sourceText}
      
      Analysoi seuraavat asiat:
      1. 'hotspots' (taulukko): 3-5 kohtaa joista kansanedustajat kiistelevät. 
         Sisällä: "topic", "argument_pro" (oikeiston/liberaalien näkökulma), "argument_con" (vasemmiston/konservatiivien näkökulma), "reasoning" (miksi kiistanalainen).
      2. 'audience_hook': Yksi napakka virke, miksi tavallisen kansalaisen pitäisi välittää tästä.
      3. 'dna_impact' (objekti): Vaikutus asteikolla 0-1 DirectDemin 6 akseliin: 
         Talous, Arvot, Ympäristö, Alueet, Globalismi, Turvallisuus.
      4. 'controversy_score': Arvio kiistanalaisuudesta 0-100.
      
      Vastaa VAIN JSON-muodossa:
      {
        "hotspots": [],
        "audience_hook": "",
        "dna_impact": {
          "economic": 0, "liberal": 0, "env": 0, "urban": 0, "global": 0, "security": 0
        },
        "controversy_score": 0
      }
    `,
  });

  const analysis = JSON.parse(analysisText);

  // 3. Tallenna profiili tietokantaan
  const { error: upsertError } = await supabase
    .from("bill_ai_profiles")
    .upsert({
      bill_id: billId,
      hotspots: analysis.hotspots,
      audience_hook: analysis.audience_hook,
      dna_impact: analysis.dna_impact,
      controversy_score: analysis.controversy_score,
      updated_at: new Date().toISOString()
    });

  if (upsertError) {
    console.error("Virhe tallennettaessa lakiprofiilia:", upsertError.message);
  }

  return analysis;
}

