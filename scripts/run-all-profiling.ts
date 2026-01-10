const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const { createClient } = require("@supabase/supabase-js");
const { generateMPPersona } = require("../lib/ai/persona-generator");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runProfilingForAll() {
  console.log("Aloitetaan kaikkien kansanedustajien AI-profilointi...");

  // 1. Hae kaikki aktiiviset kansanedustajat
  const { data: mps, error: mpsError } = await supabase
    .from("mps")
    .select("id, first_name, last_name")
    .eq("is_active", true);

  if (mpsError) {
    console.error("Virhe haettaessa kansanedustajia:", mpsError);
    return;
  }

  console.log(`Löytyi ${mps?.length} aktiivista kansanedustajaa.`);

  // 2. Hae jo profiloidut id:t
  const { data: existingProfiles } = await supabase
    .from("mp_ai_profiles")
    .select("mp_id");
  
  const existingIds = new Set((existingProfiles as any[])?.map(p => p.mp_id) || []);
  console.log(`Jo profiloituja: ${existingIds.size}`);

  const missingMps = (mps as any[])?.filter(mp => !existingIds.has(mp.id)) || [];
  console.log(`Puuttuvia profiileja: ${missingMps.length}`);

  if (missingMps.length === 0) {
    console.log("Kaikki aktiiviset kansanedustajat on jo profiloitu.");
    return;
  }

  // 3. Suoritetaan profilointi puuttuville
  for (const mp of missingMps) {
    try {
      console.log(`Profiloidaan: ${mp.first_name} ${mp.last_name} (ID: ${mp.id})...`);
      await generateMPPersona(mp.id.toString());
      console.log(`✓ Valmis: ${mp.first_name} ${mp.last_name}`);
      
      // Pieni viive AI-kutsujen välillä
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error: any) {
      console.error(`✕ Virhe edustajan ${mp.first_name} ${mp.last_name} kohdalla:`, error.message);
    }
  }

  console.log("Kaikki puuttuvat profiilit käsitelty.");
}

runProfilingForAll().catch(console.error);
