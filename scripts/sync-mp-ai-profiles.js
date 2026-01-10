const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const { createClient } = require("@supabase/supabase-js");

// We use require here to ensure dotenv has loaded before persona-generator initializes its supabase client
const { generateMPPersona } = require("../lib/ai/persona-generator");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncAllMPAIProfiles() {
  console.log("--- Aloitetaan kaikkien kansanedustajien AI-profilointi ---");

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
    return;
  }

  // 3. Prosessoi puuttuvat
  for (const mp of mpsToProcess) {
    try {
      console.log(`Prosessoidaan: ${mp.first_name} ${mp.last_name} (ID: ${mp.id})...`);
      await generateMPPersona(mp.id);
      console.log(`✅ Valmis: ${mp.first_name} ${mp.last_name}`);
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      console.error(`❌ Virhe MP:lle ${mp.id}:`, err.message);
    }
  }

  console.log("--- Kaikkien kansanedustajien AI-profilointi valmis! ---");
}

syncAllMPAIProfiles();

