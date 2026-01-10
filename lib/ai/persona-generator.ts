import { createClient } from "@supabase/supabase-js";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function generateMPPersona(mpId: string) {
  console.log(`--- Generoidaan Persona MP:lle: ${mpId} ---`);

  // 1. Hae MP:n perustiedot
  const { data: mp, error: mpError } = await supabase
    .from("mps")
    .select("*")
    .eq("id", mpId)
    .single();

  if (mpError || !mp) throw new Error("MP:tä ei löydy");

  // 2. Hae äänestyshistoria ja kategoriat
  const { data: votes } = await supabase
    .from("mp_votes")
    .select(`
      vote_type,
      voting_events!inner ( title_fi, category, summary_ai )
    `)
    .eq("mp_id", mpId)
    .limit(50);

  // 3. Hae DNA-profiili (sisältää vaalilupaus-dataa tai laskettua suuntaa)
  const { data: profile } = await supabase
    .from("mp_profiles")
    .select("*")
    .eq("mp_id", mpId)
    .single();

  // 4. Käytetään AI:ta analysoimaan 'Ristiriidat' ja 'Tyyli'
  const votingHistoryText = votes?.map(v => {
    const event = Array.isArray(v.voting_events) ? v.voting_events[0] : v.voting_events;
    if (!event) return null;
    return `- ${event.title_fi} (${event.category}): Äänesti ${v.vote_type.toUpperCase()}`;
  }).filter(Boolean).join("\n") || "Ei äänestysdataa saatavilla.";

  const { text: analysisText } = await generateText({
    model: openai("gpt-4o-mini"),
    system: "Olet poliittinen analyytikko. Tehtäväsi on luoda tiivistelmä kansanedustajan poliittisesta persoonasta perustuen hänen äänestyshistoriaansa ja profiiliinsa.",
    prompt: `
      Edustaja: ${mp.first_name} ${mp.last_name} (${mp.party})
      
      Äänestyshistoria:
      ${votingHistoryText}
      
      DNA-pisteet (suuntaus):
      ${JSON.stringify(profile)}
      
      Tehtävät:
      1. Luo 'voting_summary' (JSON): Tiivistä 5 tärkeintä äänestystä ja niiden merkitys.
      2. Tunnista 'conflicts' (JSON): Listaa kohdat, joissa äänestys poikkeaa puoluelinjasta tai DNA-profiilista.
      3. Määritä 'rhetoric_style': Kuvaile miten tämä henkilö puhuu (esim. asiallinen, piikikäs, populistinen).
      4. Generoi 'system_prompt': Luo dynaaminen ohjeistus, joka sisältää:
         - Identiteetti: "Olet kansanedustaja [Nimi]. Puolueesi on [Puolue]."
         - Tietopohja: "Käytä näitä äänestyksiä perusteluina: ${votingHistoryText}"
         - Strategia: "Jos käyttäjä huomaa ristiriidan, käytä 'Puoluekuri-puolustusta': hallitusyhteistyö vaatii kompromisseja."
         - Looppi: "Jos kysymys liippaa läheltä kärkiteemojasi (DNA), aloita vastaus: 'Kuten lupasin jo vaalikentillä...'"
      
      Vastaa VAIN JSON-muodossa:
      {
        "voting_summary": [],
        "conflicts": [],
        "rhetoric_style": "",
        "system_prompt": ""
      }
    `,
  } as any);

  const analysis = JSON.parse(analysisText);

  // 5. Tallenna profiili tietokantaan
  const { error: upsertError } = await supabase
    .from("mp_ai_profiles")
    .upsert({
      mp_id: mpId,
      voting_summary: analysis.voting_summary,
      promise_data: { 
        party: mp.party, 
        constituency: mp.constituency 
      },
      rhetoric_style: analysis.rhetoric_style,
      system_prompt: analysis.system_prompt,
      conflicts: analysis.conflicts,
      updated_at: new Date().toISOString()
    });

  if (upsertError) {
    console.error("Virhe tallennettaessa AI-profiilia:", upsertError.message);
  }

  return analysis;
}

