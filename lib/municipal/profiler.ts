import { createClient } from "@supabase/supabase-js";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

/**
 * Creates a 'Municipal Fingerprint' for a councilor based on their election promises.
 */
export async function profileMunicipalCouncilor(councilorId: string) {
  console.log(`--- Profiloidaan kunnallisvaltuutettu: ${councilorId} ---`);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Hae valtuutetun tiedot ja lupaukset
  const { data: councilor, error } = await supabase
    .from("municipal_councilor_profiles")
    .select("*")
    .eq("id", councilorId)
    .single();

  if (error || !councilor) throw new Error("Valtuutettua ei löydy");

  const promisesText = JSON.stringify(councilor.raw_promises);

  // 2. Käytä AI:ta mäppäämään lupaukset 6-akseliseen DNA-malliin
  // Akselit: Talous, Arvot, Ympäristö, Alueellisuus, Kansainvälisyys (paikallinen yhteistyö), Turvallisuus
  const { text: dnaText } = await generateText({
    model: openai("gpt-4o-mini"),
    system: `Olet poliittinen analyytikko. Tehtäväsi on luoda kunnallisvaltuutetun 'DNA-sormenjälki' perustuen hänen vaalikonevastauksiinsa.
    Käytä asteikkoa -1.0 ... 1.0 jokaiselle akselille.
    
    Akselit paikallisella tasolla:
    - economy: -1 (investoinnit/velka) ... 1 (säästöt/veroäyri)
    - values: -1 (liberaali/uudistava) ... 1 (konservatiivi/perinteinen)
    - environment: -1 (rakentaminen/kasvu) ... 1 (suojelu/puistot)
    - regional: -1 (keskittäminen) ... 1 (lähipalvelut/haja-asutus)
    - international: -1 (eristäytyvä) ... 1 (verkostoituva/yhteistyö)
    - security: -1 (luottamus) ... 1 (valvonta/järjestys)`,
    prompt: `
      Valtuutettu: ${councilor.full_name} (${councilor.municipality})
      Lupaukset ja vastaukset: ${promisesText}
      
      Analysoi vastaukset ja palauta DNA-pisteet.
      Vastaa VAIN JSON-muodossa:
      {
        "economy": 0.0,
        "values": 0.0,
        "environment": 0.0,
        "regional": 0.0,
        "international": 0.0,
        "security": 0.0
      }
    `,
  } as any);

  const dnaFingerprint = JSON.parse(dnaText);

  // 3. Tallenna sormenjälki
  const { error: updateError } = await supabase
    .from("municipal_councilor_profiles")
    .update({ 
      dna_fingerprint: dnaFingerprint,
      updated_at: new Date().toISOString()
    })
    .eq("id", councilorId);

  if (updateError) {
    console.error("Virhe tallennettaessa valtuutetun DNA:ta:", updateError.message);
    throw updateError;
  }

  return dnaFingerprint;
}

/**
 * Päivittää valtuutetun DNA-sormenjälkeä perustuen hänen puheenvuoroihinsa.
 */
export async function refineCouncilorDNAWithSpeeches(councilorId: string, municipality: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Hae valtuutetun nimi
  const { data: councilor } = await supabase
    .from("councilors")
    .select("full_name, dna_fingerprint")
    .eq("id", councilorId)
    .single();

  if (!councilor) return;

  // 2. Hae kaikki kokousanalyysit, joissa valtuutettu mainitaan
  const { data: meetings } = await supabase
    .from("meeting_analysis")
    .select("ai_summary, raw_content")
    .eq("municipality", municipality)
    .contains("ai_summary->mentioned_councilors", [councilor.full_name]);

  if (!meetings || meetings.length === 0) return;

  console.log(`🎤 Refinoimalla ${councilor.full_name} DNA:ta ${meetings.length} puheenvuoron perusteella...`);

  // 3. Analysoidaan puheenvuorojen poliittinen linja
  const speechesContext = meetings.map(m => m.ai_summary.summary).join("\n\n");

  const { text: refinedDna } = await generateText({
    model: openai("gpt-4o-mini"),
    system: `Olet poliittinen analyytikko. Tehtäväsi on päivittää valtuutetun DNA-sormenjälki (-1.0 ... 1.0) 
    perustuen hänen puheenvuoroihinsa ja toimintaansa kokouksissa.
    
    Nykyinen DNA: ${JSON.stringify(councilor.dna_fingerprint)}`,
    prompt: `
      Valtuutettu: ${councilor.full_name}
      Puheenvuorojen tiivistelmät:
      ${speechesContext}
      
      Analysoi onko valtuutetun linja muuttunut tai vahvistunut tietyillä akseleilla (economy, values, environment, regional, international, security).
      Palauta päivitetty koko DNA-objekti JSON-muodossa.
    `
  } as any);

  try {
    const dna = JSON.parse(refinedDna.replace(/```json\n?/, "").replace(/\n?```/, "").trim());
    await supabase.from("councilors").update({ dna_fingerprint: dna }).eq("id", councilorId);
    console.log(`✅ DNA päivitetty valtuutetulle ${councilor.full_name}`);
  } catch (e) {
    console.error("Failed to parse refined DNA JSON");
  }
}

