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
 * Runs profiling for all councilors who have raw promises but no DNA yet.
 */
export async function profileAllPendingCouncilors() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: pending } = await supabase
    .from("municipal_councilor_profiles")
    .select("id")
    .is("dna_fingerprint", null);

  if (!pending) return;

  console.log(`Prosessoidaan ${pending.length} valtuutettua...`);

  for (const c of pending) {
    try {
      await profileMunicipalCouncilor(c.id);
      // Pieni viive API-rajoitusten takia
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`Virhe profiloinnissa ${c.id}:`, err);
    }
  }
}

