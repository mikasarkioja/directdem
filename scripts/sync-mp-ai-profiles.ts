import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

async function run() {
  // Dynamically import AFTER dotenv.config()
  const { generateMPPersona } = await import("../lib/ai/persona-generator");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log("--- Aloitetaan kansanedustajien AI-profilointi ---");

  // 1. Hae kaikki MP:t
  const { data: mps, error: mpsError } = await supabase
    .from("mps")
    .select("id, first_name, last_name");

  if (mpsError) {
    console.error("Virhe haettaessa kansanedustajia:", mpsError.message);
    return;
  }

  // 2. Hae olemassa olevat AI-profiilit
  const { data: aiProfiles } = await supabase
    .from("mp_ai_profiles")
    .select("mp_id");

  const existingMpIds = new Set(aiProfiles?.map(p => p.mp_id) || []);
  
  const mpsToProcess = mps.filter(mp => !existingMpIds.has(mp.id));
  
  console.log(`Yhteensä kansanedustajia: ${mps.length}`);
  console.log(`AI-profiili puuttuu: ${mpsToProcess.length}`);

  if (mpsToProcess.length === 0) {
    console.log("Kaikilla kansanedustajilla on jo AI-profiili.");
    // Jos haluat ajaa kaikki uudestaan, poista filter ylhäältä
    // return; 
  }

  // Jos haluat ajaa vain muutaman testiksi:
  // const limit = 5;
  // const limitedMps = mpsToProcess.slice(0, limit);
  
  for (const mp of mpsToProcess) {
    try {
      console.log(`Prosessoidaan: ${mp.first_name} ${mp.last_name} (ID: ${mp.id})...`);
      await generateMPPersona(mp.id);
      console.log(`✅ Valmis: ${mp.first_name} ${mp.last_name}`);
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err: any) {
      console.error(`❌ Virhe MP:lle ${mp.id}:`, err.message);
    }
  }

  console.log("--- AI-profilointi suoritettu loppuun! ---");
}

run();
