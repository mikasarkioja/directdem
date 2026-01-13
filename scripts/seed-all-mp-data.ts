import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PARTIES = {
  KOK: "Parliamentary Group of the National Coalition Party",
  SDP: "Social Democratic Parliamentary Group",
  PS: "The Finns Party Parliamentary Group",
  KESK: "Centre Party Parliamentary Group",
  VIHR: "Green Parliamentary Group",
  VAS: "Left Alliance Parliamentary Group",
  RKP: "Swedish Parliamentary Group",
  KD: "Christian Democratic Parliamentary Group",
  LIIK: "Liike Nyt-Movement's Parliamentary Group"
};

const LOBBYISTS = [
  { org: "Elinkeinoelämän keskusliitto EK", topics: ["Työmarkkinat", "Verotus", "Kilpailukyky"] },
  { org: "SAK", topics: ["Työntekijöiden oikeudet", "Sosiaaliturva", "Palkkaus"] },
  { org: "MTK", topics: ["Maatalouden tuet", "Huoltovarmuus", "Metsätalous"] },
  { org: "Sivistystyönantajat", topics: ["Koulutus", "TKI-panostukset"] },
  { org: "Kuntaliitto", topics: ["Valtionosuudet", "Sote-rahoitus"] },
  { org: "Finnish Energy", topics: ["Energiaverotus", "Ydinvoima", "Vihreä siirtymä"] },
  { org: "Amnesty International", topics: ["Ihmisoikeudet", "Maahanmuutto"] },
  { org: "Suomen Yrittäjät", topics: ["Pienyrittäjyys", "Paikallinen sopiminen"] }
];

const HOMETOWNS = ["Helsinki", "Espoo", "Tampere", "Vantaa", "Oulu", "Turku", "Jyväskylä", "Lahti", "Kuopio", "Pori", "Kouvola", "Joensuu", "Lappeenranta", "Hämeenlinna", "Vaasa", "Seinäjoki", "Rovaniemi", "Mikkeli", "Kotka", "Salo"];

const SENTIMENTS = [
  "Optimistinen tulevaisuuden suhteen",
  "Kriittinen nykyistä hallituspolitiikkaa kohtaan",
  "Huolestunut taloustilanteesta",
  "Päättäväinen uudistusten edistäjä",
  "Puolustuskannalla leikkausten suhteen",
  "Innostunut digitaalisista mahdollisuuksista"
];

async function seedAllMPMotivations() {
  console.log("🚀 Seeding motivations and regional data for all active MPs...");

  // 1. Get all active MPs
  const { data: mps, error: mpsError } = await supabase
    .from("mps")
    .select("id, first_name, last_name, party, constituency")
    .eq("is_active", true);

  if (mpsError || !mps) {
    console.error("❌ Could not fetch MPs:", mpsError?.message);
    return;
  }

  console.log(`📍 Found ${mps.length} active MPs.`);

  for (const mp of mps) {
    process.stdout.write(`   - MP ${mp.id}: ${mp.last_name}... `);

    // Randomize data
    const lobbyCount = Math.floor(Math.random() * 3) + 1;
    const lobbyist_meetings = [];
    for (let i = 0; i < lobbyCount; i++) {
      const l = LOBBYISTS[Math.floor(Math.random() * LOBBYISTS.length)];
      lobbyist_meetings.push({
        org: l.org,
        topic: l.topics[Math.floor(Math.random() * l.topics.length)],
        date: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 60).toISOString().split('T')[0]
      });
    }

    const affiliations = [
      { org: mp.party, role: "Kansanedustaja" },
      { org: HOMETOWNS[Math.floor(Math.random() * HOMETOWNS.length)], role: "Kaupunginvaltuutettu" }
    ];
    if (Math.random() > 0.7) {
      affiliations.push({ org: "Paikallinen säätiö", role: "Hallituksen jäsen" });
    }

    const current_sentiment = SENTIMENTS[Math.floor(SENTIMENTS.length * Math.random())];
    const regional_bias = `Suosi ${mp.constituency || 'oman alueen'} ja ${HOMETOWNS[Math.floor(Math.random() * HOMETOWNS.length)]} etua päätöksenteossa.`;

    // Update mp_ai_profiles
    const { error: aiError } = await supabase
      .from("mp_ai_profiles")
      .upsert({
        mp_id: mp.id.toString(),
        lobbyist_meetings,
        affiliations,
        current_sentiment,
        regional_bias,
        updated_at: new Date().toISOString()
      }, { onConflict: 'mp_id' });

    if (aiError) {
      console.log(`❌ AI Profile: ${aiError.message}`);
    } else {
      // Update mps table
      const { error: mpUpdateError } = await supabase
        .from("mps")
        .update({
          hometown: HOMETOWNS[Math.floor(Math.random() * HOMETOWNS.length)]
        })
        .eq("id", mp.id);
      
      if (mpUpdateError) {
        console.log(`❌ MP Data: ${mpUpdateError.message}`);
      } else {
        console.log(`✅ OK`);
      }
    }
  }

  console.log("\n✨ All MP motivations and regional data seeded!");
}

seedAllMPMotivations();

