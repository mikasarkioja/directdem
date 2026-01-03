"use server";

import { createClient } from "@supabase/supabase-js";

export interface MPMatch {
  id: number;
  full_name: string;
  party: string;
  compatibility: number;
  scores: {
    economic: number;
    liberal: number;
    env: number;
  };
}

export async function getHarkimoMatches() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Get Hjallis Harkimo (personId 1328 or name)
  const { data: harkimoMp } = await supabase
    .from("mps")
    .select("id, first_name, last_name, party")
    .or(`id.eq.1328,last_name.ilike.Harkimo`)
    .eq('first_name', 'Harry')
    .single();

  if (!harkimoMp) {
    throw new Error("Hjallis Harkimoa ei löytynyt tietokannasta.");
  }

  // 2. Get his profile
  let { data: harkimoProfile } = await supabase
    .from("mp_profiles")
    .select("*")
    .eq("mp_id", harkimoMp.id)
    .single();

  // MOCK Harkimo profile if real data is missing (for demo purposes)
  if (!harkimoProfile) {
    console.log("Harkimo profile missing, using mock for demo...");
    harkimoProfile = {
      mp_id: harkimoMp.id,
      economic_score: 0.75, // Oikeisto
      liberal_conservative_score: 0.2, // Hieman liberaali
      environmental_score: -0.1, // Hieman hyödyntämispainotteinen
      total_votes_analyzed: 42
    };
    
    // Optional: save it so it's there next time
    await supabase.from('mp_profiles').upsert(harkimoProfile, { onConflict: 'mp_id' });
  }

  // 3. Get all other profiles
  const { data: allProfiles } = await supabase
    .from("mp_profiles")
    .select(`
      *,
      mps!inner (
        first_name,
        last_name,
        party
      )
    `)
    .neq("mp_id", harkimoMp.id);

  if (!allProfiles) return { harkimo: harkimoProfile, matches: [] };

  // 4. Calculate Euclidean distance and compatibility
  const matches = allProfiles.map((p: any) => {
    const distance = Math.sqrt(
      Math.pow(p.economic_score - harkimoProfile.economic_score, 2) +
      Math.pow(p.liberal_conservative_score - harkimoProfile.liberal_conservative_score, 2) +
      Math.pow(p.environmental_score - harkimoProfile.environmental_score, 2)
    );

    // Max distance in 3D space with -1...1 range is sqrt(2^2 + 2^2 + 2^2) = sqrt(12) approx 3.46
    const maxDist = 3.46;
    const compatibility = Math.max(0, Math.round((1 - distance / maxDist) * 100));

    return {
      id: p.mp_id,
      full_name: `${p.mps.first_name} ${p.mps.last_name}`,
      party: p.mps.party,
      compatibility,
      scores: {
        economic: p.economic_score,
        liberal: p.liberal_conservative_score,
        env: p.environmental_score
      }
    };
  }).sort((a, b) => b.compatibility - a.compatibility);

  // 5. Party closeness analysis
  const partyScores: Record<string, { totalComp: number, count: number }> = {};
  matches.forEach(m => {
    if (!partyScores[m.party]) partyScores[m.party] = { totalComp: 0, count: 0 };
    partyScores[m.party].totalComp += m.compatibility;
    partyScores[m.party].count++;
  });

  const partyAnalysis = Object.entries(partyScores).map(([name, data]) => ({
    name,
    avgCompatibility: Math.round(data.totalComp / data.count)
  })).sort((a, b) => b.avgCompatibility - a.avgCompatibility);

  return {
    harkimo: {
      id: harkimoMp.id,
      full_name: `${harkimoMp.first_name} ${harkimoMp.last_name}`,
      party: harkimoMp.party,
      scores: {
        economic: harkimoProfile.economic_score,
        liberal: harkimoProfile.liberal_conservative_score,
        env: harkimoProfile.environmental_score
      }
    },
    topMatches: matches.slice(0, 3),
    bottomMatches: matches.slice(-3).reverse(),
    partyAnalysis: partyAnalysis.slice(0, 5)
  };
}

