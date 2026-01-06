import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CATEGORIES = ["Talous", "Arvot", "Ympäristö"];
const QUESTIONS_PER_CAT = 3;

async function seedData() {
  console.log("Seeding mock pivot data...");

  // Tyhjennetään vanha data ensin
  await supabase.from('mp_candidate_responses').delete().neq('id', 0);

  const { data: mps } = await supabase
    .from('mps')
    .select('id, party, first_name, last_name')
    .eq('is_active', true);

  if (!mps || mps.length === 0) {
    console.error("No active MPs found.");
    return;
  }

  const { data: mpProfiles } = await supabase
    .from('mp_profiles')
    .select('*');

  const profileMap = new Map(mpProfiles?.map(p => [p.mp_id, p]));

  const responses = [];

  for (const mp of mps) {
    const profile = profileMap.get(mp.id);
    if (!profile) continue;

    for (const cat of CATEGORIES) {
      for (let i = 1; i <= QUESTIONS_PER_CAT; i++) {
        let score = 0;
        if (cat === "Talous") score = profile.economic_score;
        if (cat === "Arvot") score = profile.liberal_conservative_score;
        if (cat === "Ympäristö") score = profile.environmental_score;

        // Normalisoi: score (-1...1) -> response (1...5)
        // val = 3 - (score * 2)
        let baseResponse = Math.round(3 - (score * 2));
        
        // Lisää hieman satunnaisuutta ja "takinkääntöä" tietyille puolueille
        // Hallituspuolueet (KOK, PS, RKP, KD) kääntävät takkia enemmän demossa
        const isGov = ["KOK", "PS", "RKP", "KD"].includes(mp.party);
        let finalResponse = baseResponse;
        
        if (isGov && Math.random() > 0.7) {
          // Takinkääntö: muutetaan vastausta 1-2 pykälää
          const shift = Math.random() > 0.5 ? 2 : -2;
          finalResponse = Math.max(1, Math.min(5, baseResponse + shift));
        } else if (Math.random() > 0.9) {
          // Satunnainen heitto muillekin
          finalResponse = Math.max(1, Math.min(5, baseResponse + (Math.random() > 0.5 ? 1 : -1)));
        }

        responses.push({
          mp_id: mp.id,
          question_text: `${cat} kysymys #${i}`,
          response_value: finalResponse,
          category: cat
        });
      }
    }

    // Insert in batches of 1000
    if (responses.length > 1000) {
      const { error } = await supabase.from('mp_candidate_responses').insert(responses);
      if (error) console.error("Error inserting batch:", error);
      responses.length = 0;
      console.log(`Inserted 1000 responses...`);
    }
  }

  if (responses.length > 0) {
    const { error } = await supabase.from('mp_candidate_responses').insert(responses);
    if (error) console.error("Error inserting last batch:", error);
  }

  console.log("✅ Seed complete! Mock pivot data generated for all active MPs.");
}

seedData();

