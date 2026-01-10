import { createClient } from "@supabase/supabase-js";
import { streamText, StreamData } from "ai";
import { openai } from "@ai-sdk/openai";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { messages, championId, challengerId, billId, userDna } = await req.json();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Fetch both MP profiles
  const { data: mpsData, error: mpsError } = await supabase
    .from("mp_ai_profiles")
    .select(`
      mp_id,
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
    .in("mp_id", [championId, challengerId]);

  if (mpsError || !mpsData || mpsData.length < 2) {
    return new Response(JSON.stringify({ error: "Molempien edustajien profiilit on oltava alustettu." }), { status: 404 });
  }

  const champion = mpsData.find(m => m.mp_id === championId);
  const challenger = mpsData.find(m => m.mp_id === challengerId);

  if (!champion || !challenger) {
    return new Response(JSON.stringify({ error: "Yksi tai molemmat edustajien AI-profiileista puuttuu." }), { status: 404 });
  }

  // 2. Fetch Bill Profile
  const { data: billProfile } = await supabase
    .from("bill_ai_profiles")
    .select("*")
    .eq("bill_id", billId)
    .single();

  // 3. Conflict Analysis between the two MPs
  const champDna = champion.mp_profiles;
  const challDna = challenger.mp_profiles;
  
  let distance = 0;
  if (champDna && challDna) {
    const diffs = [
      Math.pow((champDna.economic_score || 0) - (challDna.economic_score || 0), 2),
      Math.pow((champDna.liberal_conservative_score || 0) - (challDna.liberal_conservative_score || 0), 2),
      Math.pow((champDna.environmental_score || 0) - (challDna.environmental_score || 0), 2),
      Math.pow((champDna.urban_rural_score || 0) - (challDna.urban_rural_score || 0), 2),
      Math.pow((champDna.international_national_score || 0) - (challDna.international_national_score || 0), 2),
      Math.pow((champDna.security_score || 0) - (challDna.security_score || 0), 2),
    ];
    distance = Math.sqrt(diffs.reduce((a, b) => a + b, 0));
  }

  const lastMessage = messages[messages.length - 1];
  
  // Decide who is currently relevant
  const provocationLevel = distance > 2.5 ? "KORKEA (Spicy)" : (distance > 1.5 ? "KESKITASO" : "MATALA (Rakentava)");

  const systemPrompt = `
    POLIITTINEN KAKSINTAISTELU - MODERAATTORI-MOODI
    
    Olet kokenut poliittinen moderaattori. Ohjaat kahden AI-agentin välistä väittelyä.
    
    OSAPUOLET:
    1. CHAMPION (Agentti A): ${champion.mps.first_name} ${champion.mps.last_name} (${champion.mps.party}). 
       - Tyyli: ${champion.rhetoric_style} (Hjalliksen tyyli: suora, liikemiesmäinen, populistinen, kriittinen valtavirtaa kohtaan).
       - Perustus: ${champion.system_prompt}
       - Äänestykset: ${JSON.stringify(champion.voting_summary)}
    
    2. CHALLENGER (Agentti B): ${challenger.mps.first_name} ${challenger.mps.last_name} (${challenger.mps.party}). 
       - Tyyli: ${challenger.rhetoric_style}
       - Perustus: ${challenger.system_prompt}
       - Äänestykset: ${JSON.stringify(challenger.voting_summary)}
    
    KONTEKSTI (LAKI):
    ${billProfile ? `Aihe: ${billProfile.audience_hook}. Hotspotit: ${JSON.stringify(billProfile.hotspots)}` : "Yleinen poliittinen linjaus."}
    
    IDEOLOGINEN JÄNNITE: ${distance.toFixed(2)} / 5.0 -> Provokaatio-taso: ${provocationLevel}.
    
    VÄITTELYN SÄÄNNÖT JA AGENTTI-KETJU:
    1. Jos viestihistoria on tyhjä (aloitus), kirjoita CHAMPIONIN (Hjalliksen) kärkkäin avausväite.
    2. Jos edellinen puhuja oli CHAMPION, kirjoita CHALLENGERIN vastaus. CHALLENGERIN on käytettävä faktoja tai aiempia lupauksiaan.
    3. Jos edellinen puhuja oli CHALLENGER, kirjoita CHAMPIONIN kuitti.
    4. RISTIINVIITTAUS (SPICY): Etsi edustajan vastapuolen argumenteista ristiriitoja hänen äänestyshistoriaansa tai DNA-profiiliinsa nähden. Jos löydät takinkäännön, HYÖKKÄÄ sitä vastaan.
    5. PUOLUSTUSLOGIIKKA: Jos edustaja jää kiinni epäjohdonmukaisuudesta, käytä "Puoluekuri-korttia" tai "Reaalipolitiikka-korttia" (esim. "Teimme kompromissin hallituksessa").
    
    FORMATOINTI:
    - Aloita viesti: [SPEAKER: CHAMPION|CHALLENGER]
    - Lisää tila: [STATUS: Hyökkää|Puolustautuu|Selittää kompromissia|Kunnioittaa|Haastaa takinkäännöstä]
    - Jos viittaat dataan: [FACTS: {"bill": "Lain nimi", "vote": "Jaa/Ei", "source": "Äänestys/Lupaus"}]
    
    KÄYTTÄJÄN ROOLI:
    Käyttäjä on "Erotuomari". Jos hän heittää väliin kysymyksen, molemmat agentit vastaavat siihen peräkkäin lyhyesti omasta näkökulmastaan.
  `;

  const data = new StreamData();

  const result = streamText({
    model: openai("gpt-4o"),
    system: systemPrompt,
    messages,
    onFinish() {
      data.close();
    },
  });

  return result.toDataStreamResponse({ data });
}

