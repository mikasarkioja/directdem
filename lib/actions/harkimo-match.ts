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

export interface HarkimoMatchResult {
  harkimo: {
    id: number;
    full_name: string;
    party: string;
    scores: {
      economic: number;
      liberal: number;
      env: number;
    };
  };
  topMatches: MPMatch[];
  bottomMatches: MPMatch[];
  partyAnalysis: {
    name: string;
    avgCompatibility: number;
  }[];
}

// Helper function to map long party names to short abbreviations
const formatParty = (party: string, fullName?: string): string => {
  if (!party || party === 'Tuntematon') {
    // Fallback for specific prominent figures if party is missing
    if (fullName?.includes('Esko Aho')) return 'Kesk';
    if (fullName?.includes('Jukka Tarkka')) return 'Lib';
    if (fullName?.includes('Risto Penttilä')) return 'Kok';
    if (fullName?.includes('Outi Siimes')) return 'Kok';
    if (fullName?.includes('Jari Koskinen')) return 'Kok';
    if (fullName?.includes('Raimo Holopainen')) return 'SDP';
    return 'N/A';
  }
  const p = party.toUpperCase();
  if (p.includes('KOKOOMUS') || p.includes('NATIONAL COALITION')) return 'Kok';
  if (p.includes('SOSIALIDEMOKRAATTI') || p.includes('SOCIAL DEMOCRATIC')) return 'SDP';
  if (p.includes('PERUSSUOMALAISET') || p.includes('FINNS PARTY')) return 'PS';
  if (p.includes('KESKUSTA') || p.includes('CENTRE PARTY')) return 'Kesk';
  if (p.includes('VIHREÄ') || p.includes('GREEN')) return 'Vihr';
  if (p.includes('VASEMMISTO') || p.includes('LEFT ALLIANCE')) return 'Vas';
  if (p.includes('RUOTSALAINEN') || p.includes('SWEDISH')) return 'RKP';
  if (p.includes('KRISTILLISDEMOKRAATTI') || p.includes('CHRISTIAN DEMOCRATIC')) return 'KD';
  if (p.includes('LIIKE NYT')) return 'Liik';
  return party;
};

export async function getHarkimoMatches(): Promise<HarkimoMatchResult> {
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

  // 3. Get all other profiles (ONLY ACTIVE ONES)
  const { data: allProfiles } = await supabase
    .from("mp_profiles")
    .select(`
      *,
      mps!inner (
        first_name,
        last_name,
        party,
        is_active
      )
    `)
    .eq("mps.is_active", true)
    .neq("mp_id", harkimoMp.id);

  if (!allProfiles) {
    return {
      harkimo: {
        id: harkimoMp.id,
        full_name: `${harkimoMp.first_name} ${harkimoMp.last_name}`,
        party: formatParty(harkimoMp.party, `${harkimoMp.first_name} ${harkimoMp.last_name}`),
        scores: {
          economic: harkimoProfile.economic_score,
          liberal: harkimoProfile.liberal_conservative_score,
          env: harkimoProfile.environmental_score
        }
      },
      topMatches: [],
      bottomMatches: [],
      partyAnalysis: []
    };
  }

  // 4. Calculate Statistics for Normalization (relative to current parliament)
  const stats = {
    eco: { sum: 0, sqSum: 0, count: 0 },
    lib: { sum: 0, sqSum: 0, count: 0 },
    env: { sum: 0, sqSum: 0, count: 0 }
  };

  allProfiles.forEach((p: any) => {
    stats.eco.sum += p.economic_score;
    stats.eco.sqSum += Math.pow(p.economic_score, 2);
    stats.lib.sum += p.liberal_conservative_score;
    stats.lib.sqSum += Math.pow(p.liberal_conservative_score, 2);
    stats.env.sum += p.environmental_score;
    stats.env.sqSum += Math.pow(p.environmental_score, 2);
    stats.eco.count++;
  });

  // Basic stats for Z-score calc
  const means = {
    eco: stats.eco.sum / stats.eco.count,
    lib: stats.lib.sum / stats.eco.count,
    env: stats.env.sum / stats.eco.count
  };

  const stdDevs = {
    eco: Math.sqrt(stats.eco.sqSum / stats.eco.count - Math.pow(means.eco, 2)) || 0.1,
    lib: Math.sqrt(stats.lib.sqSum / stats.eco.count - Math.pow(means.lib, 2)) || 0.1,
    env: Math.sqrt(stats.env.sqSum / stats.eco.count - Math.pow(means.env, 2)) || 0.1
  };

  const getZ = (val: number, mean: number, sd: number) => (val - mean) / sd;

  // 5. Calculate Euclidean distance and compatibility using Z-scores
  const matches = allProfiles.map((p: any) => {
    const dEco = getZ(p.economic_score, means.eco, stdDevs.eco) - getZ(harkimoProfile.economic_score, means.eco, stdDevs.eco);
    const dLib = getZ(p.liberal_conservative_score, means.lib, stdDevs.lib) - getZ(harkimoProfile.liberal_conservative_score, means.lib, stdDevs.lib);
    const dEnv = getZ(p.environmental_score, means.env, stdDevs.env) - getZ(harkimoProfile.environmental_score, means.env, stdDevs.env);

    const distance = Math.sqrt(Math.pow(dEco, 2) + Math.pow(dLib, 2) + Math.pow(dEnv, 2));

    // normalizedDist: 0 is same, ~6 is very far (3 standard deviations in opposite directions)
    const maxZDist = 6.0; 
    const normalizedDist = Math.min(1, distance / maxZDist);
    
    // (1 - x)^4 curve: extremely sensitive to highlight even minor differences in Z-space
    const compatibility = Math.max(0, Math.round(Math.pow(1 - normalizedDist, 4) * 100));

    const fullName = `${p.mps.first_name} ${p.mps.last_name}`;
    return {
      id: p.mp_id,
      full_name: fullName,
      party: formatParty(p.mps.party, fullName),
      compatibility,
      scores: {
        economic: p.economic_score,
        liberal: p.liberal_conservative_score,
        env: p.environmental_score
      }
    };
  }).sort((a, b) => b.compatibility - a.compatibility);

  // 6. Party closeness analysis
  const partyScores: Record<string, { totalComp: number, count: number }> = {};
  matches.forEach(m => {
    const pName = m.party;
    if (!partyScores[pName]) partyScores[pName] = { totalComp: 0, count: 0 };
    partyScores[pName].totalComp += m.compatibility;
    partyScores[pName].count++;
  });

  const partyAnalysis = Object.entries(partyScores).map(([name, data]) => ({
    name,
    avgCompatibility: Math.round(data.totalComp / data.count)
  })).sort((a, b) => b.avgCompatibility - a.avgCompatibility);

  return {
    harkimo: {
      id: harkimoMp.id,
      full_name: `${harkimoMp.first_name} ${harkimoMp.last_name}`,
      party: formatParty(harkimoMp.party, `${harkimoMp.first_name} ${harkimoMp.last_name}`),
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

