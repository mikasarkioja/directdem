import { createClient } from "@supabase/supabase-js";
import { streamText, StreamData } from "ai";
import { openai } from "@ai-sdk/openai";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { messages, mpId, userDna, billId } = await req.json();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Hae MP:n AI-profiili, DNA-pisteet ja MP:n tiedot
  let profile: any = null;
  let mpDna: any = null;
  let mpName = "Poliittinen AI";
  let mpParty = "DirectDem";
  let mpRhetoric = "asiantunteva ja neutraali";
  let systemPromptBase = "Olet asiantunteva poliittinen tekoäly.";

  if (mpId && mpId !== "any") {
    const { data: mpFull, error: mpError } = await supabase
      .from("mp_ai_profiles")
      .select(`
        system_prompt,
        voting_summary,
        rhetoric_style,
        mps ( first_name, last_name, party ),
        mp_profiles:mp_id (
          economic_score,
          liberal_conservative_score,
          environmental_score,
          urban_rural_score,
          international_national_score,
          security_score
        )
      `)
      .eq("mp_id", mpId)
      .single();

    if (mpFull) {
      profile = mpFull;
      mpDna = mpFull.mp_profiles;
      mpName = `${mpFull.mps.first_name} ${mpFull.mps.last_name}`;
      mpParty = mpFull.mps.party;
      mpRhetoric = mpFull.rhetoric_style;
      systemPromptBase = mpFull.system_prompt;
    }
  }

  // 1.5 Hae Lakiprofiili jos billId on mukana
  let billContext = "";
  if (billId) {
    const { data: billProfile } = await supabase
      .from("bill_ai_profiles")
      .select("*")
      .eq("bill_id", billId)
      .single();
    
    if (billProfile) {
      billContext = `
        NYKYINEN LAKIESITYS:
        Hotspots: ${JSON.stringify(billProfile.hotspots)}
        Yleisö-koukku: ${billProfile.audience_hook}
        DNA-vaikutus: ${JSON.stringify(billProfile.dna_impact)}
        
        OHJE: Käytä näitä hotspot-kohtia haastaaksesi käyttäjää tai puolustaaksesi kantaasi. 
        Keskity erityisesti kohtien puolustamiseen oman puolueesi näkökulmasta.
      `;
    }
  }

  // 2. Tarkempi provokaatio-logiikka: Laske ideologinen etäisyys
  let distance = 0;
  let provocationLevel = "Neutral";
  
  if (userDna && mpDna) {
    // Lasketaan euklidinen etäisyys 6-akselisella avaruudella
    const diffs = [
      Math.pow((userDna.economic_score || 0) - (mpDna.economic_score || 0), 2),
      Math.pow((userDna.liberal_conservative_score || 0) - (mpDna.liberal_conservative_score || 0), 2),
      Math.pow((userDna.environmental_score || 0) - (mpDna.environmental_score || 0), 2),
      Math.pow((userDna.urban_rural_score || 0) - (mpDna.urban_rural_score || 0), 2),
      Math.pow((userDna.international_national_score || 0) - (mpDna.international_national_score || 0), 2),
      Math.pow((userDna.security_score || 0) - (mpDna.security_score || 0), 2),
    ];
    distance = Math.sqrt(diffs.reduce((a, b) => a + b, 0));
    
    // Etäisyys on välillä 0 - ~4.9 (jos kaikki akselit täysin vastakkaiset -1 vs 1)
    if (distance > 3.0) provocationLevel = "Hostile";
    else if (distance > 1.8) provocationLevel = "Skeptical";
    else if (distance < 0.8) provocationLevel = "Friendly";
  }

  const provocationInstructions = {
    "Friendly": "Käyttäjä jakaa arvosi. Ole hengenheimolainen, lämmin ja vahvista yhteistä näkemystä.",
    "Neutral": "Ole asiallinen ja ammattimainen kansanedustaja.",
    "Skeptical": "Käyttäjällä on eriävä näkemys. Ole hieman kireä, haasta käyttäjän logiikkaa ja puolusta linjaasi jämäkästi.",
    "Hostile": "Olette ideologisesti täysin vastakkaisilla puolilla. Ole piikikäs, käytä retoriikassasi hyökkäävyyttä ja kyseenalaista käyttäjän motiivit tai arvot suoraan."
  }[provocationLevel as keyof typeof provocationInstructions];

  const fullSystemPrompt = `
    ${systemPromptBase}
    
    ${billContext}
    
    KONTEKSTI:
    - Olet ${mpName} (${mpParty}).
    - Tyylisi on ${mpRhetoric}.
    - IDEOLOGINEN TILA: ${provocationInstructions}
    - Etäisyys käyttäjään (0-5): ${distance.toFixed(2)}.
    
    OHJEET VASTAUKSEEN:
    1. Aloita vastaus AINA tilan päivityksellä muodossa: [STATUS: Hyökkää|Puolustautuu|Selittää kompromissia|Kunnioittaa|Heittäytyy piikikkääksi]
    2. Jos käytät faktatietoa äänestyksistäsi, lisää loppuun: [FACTS: {"bill": "Nimi", "vote": "Jaa/Ei"}]
    3. Puhu minä-muodossa, ole uskottava poliitikko.
  `;

  const data = new StreamData();

  const result = streamText({
    model: openai("gpt-4o"),
    system: fullSystemPrompt,
    messages,
    onFinish() {
      data.close();
    },
  });

  return result.toDataStreamResponse({ data });
}

