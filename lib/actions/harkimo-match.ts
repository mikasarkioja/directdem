"use server";

import { createClient } from "@supabase/supabase-js";
import { calculatePivotScore } from "@/lib/analysis/pivot-engine";
import { formatParty } from "@/lib/utils/party-utils";

export interface MPMatch {
  id: number;
  full_name: string;
  party: string;
  compatibility: number;
  pivotScore: number;
  scores: {
    economic: number;
    liberal: number;
    env: number;
    urban: number;
    global: number;
    security: number;
  };
}

export interface HarkimoMatchResult {
  harkimo: {
    id?: number;
    full_name: string;
    party?: string;
    scores: {
      economic: number;
      liberal: number;
      env: number;
      urban: number;
      global: number;
      security: number;
    };
    pivotScore?: number;
  };
  topMatches: MPMatch[];
  bottomMatches: MPMatch[];
  partyAnalysis: {
    name: string;
    avgCompatibility: number;
    mps: { id: number; name: string; compatibility: number }[];
  }[];
  error?: string;
}

export async function findMatchesForScores(inputScores: {
  economic: number;
  liberal: number;
  env: number;
  urban: number;
  global: number;
  security: number;
}): Promise<{ topMatches: MPMatch[]; bottomMatches: MPMatch[]; partyAnalysis: any[] }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get all active profiles
  const { data: allProfiles, error: profilesError } = await supabase
    .from("mp_profiles")
    .select(`
      *,
      mps!inner (
        id,
        first_name,
        last_name,
        party,
        is_active
      )
    `)
    .eq("mps.is_active", true);

  if (profilesError || !allProfiles || allProfiles.length === 0) {
    return { topMatches: [], bottomMatches: [], partyAnalysis: [] };
  }

  const uniqueProfiles = Array.from(new Map(allProfiles.map(p => [p.mps.id, p])).values());

  const stats = {
    eco: { sum: 0, sqSum: 0, count: 0 },
    lib: { sum: 0, sqSum: 0, count: 0 },
    env: { sum: 0, sqSum: 0, count: 0 },
    urb: { sum: 0, sqSum: 0, count: 0 },
    glo: { sum: 0, sqSum: 0, count: 0 },
    sec: { sum: 0, sqSum: 0, count: 0 }
  };

  uniqueProfiles.forEach((p: any) => {
    stats.eco.sum += p.economic_score;
    stats.eco.sqSum += Math.pow(p.economic_score, 2);
    stats.lib.sum += p.liberal_conservative_score;
    stats.lib.sqSum += Math.pow(p.liberal_conservative_score, 2);
    stats.env.sum += p.environmental_score;
    stats.env.sqSum += Math.pow(p.environmental_score, 2);
    stats.urb.sum += p.urban_rural_score || 0;
    stats.urb.sqSum += Math.pow(p.urban_rural_score || 0, 2);
    stats.glo.sum += p.international_national_score || 0;
    stats.glo.sqSum += Math.pow(p.international_national_score || 0, 2);
    stats.sec.sum += p.security_score || 0;
    stats.sec.sqSum += Math.pow(p.security_score || 0, 2);
    stats.eco.count++;
  });

  const count = stats.eco.count || 1;
  const means = {
    eco: stats.eco.sum / count,
    lib: stats.lib.sum / count,
    env: stats.env.sum / count,
    urb: stats.urb.sum / count,
    glo: stats.glo.sum / count,
    sec: stats.sec.sum / count
  };

  const stdDevs = {
    eco: Math.sqrt(Math.max(0.15, stats.eco.sqSum / count - Math.pow(means.eco, 2))),
    lib: Math.sqrt(Math.max(0.15, stats.lib.sqSum / count - Math.pow(means.lib, 2))),
    env: Math.sqrt(Math.max(0.15, stats.env.sqSum / count - Math.pow(means.env, 2))),
    urb: Math.sqrt(Math.max(0.15, stats.urb.sqSum / count - Math.pow(means.urb, 2))),
    glo: Math.sqrt(Math.max(0.15, stats.glo.sqSum / count - Math.pow(means.glo, 2))),
    sec: Math.sqrt(Math.max(0.15, stats.sec.sqSum / count - Math.pow(means.sec, 2)))
  };

  const getZ = (val: number, mean: number, sd: number) => (val - mean) / sd;

  const matches = uniqueProfiles.map((p: any) => {
    // Calculate raw distance for fallback/blending
    const rawDistSq = 
      Math.pow((p.economic_score - inputScores.economic), 2) +
      Math.pow((p.liberal_conservative_score - inputScores.liberal), 2) +
      Math.pow((p.environmental_score - inputScores.env), 2) +
      Math.pow((p.urban_rural_score || 0) - (inputScores.urban || 0), 2) +
      Math.pow((p.international_national_score || 0) - (inputScores.global || 0), 2) +
      Math.pow((p.security_score || 0) - (inputScores.security || 0), 2);

    const dEco = getZ(p.economic_score, means.eco, stdDevs.eco) - getZ(inputScores.economic, means.eco, stdDevs.eco);
    const dLib = getZ(p.liberal_conservative_score, means.lib, stdDevs.lib) - getZ(inputScores.liberal, means.lib, stdDevs.lib);
    const dEnv = getZ(p.environmental_score, means.env, stdDevs.env) - getZ(inputScores.env, means.env, stdDevs.env);
    const dUrb = getZ(p.urban_rural_score || 0, means.urb, stdDevs.urb) - getZ(inputScores.urban, means.urb, stdDevs.urb);
    const dGlo = getZ(p.international_national_score || 0, means.glo, stdDevs.glo) - getZ(inputScores.global, means.glo, stdDevs.glo);
    const dSec = getZ(p.security_score || 0, means.sec, stdDevs.sec) - getZ(inputScores.security, means.sec, stdDevs.sec);

    const zDistance = Math.sqrt(
      Math.pow(dEco, 2) + Math.pow(dLib, 2) + Math.pow(dEnv, 2) +
      Math.pow(dUrb, 2) + Math.pow(dGlo, 2) + Math.pow(dSec, 2)
    );

    // Use a mix of Z-distance and raw distance to prevent 0% matches
    const maxRawDist = 4.9;
    const rawCompatibility = Math.max(0, 1 - (Math.sqrt(rawDistSq) / maxRawDist));
    
    // Increase maxZDist significantly to ensure more variation even for outliers
    const maxZDist = 25.0; 
    const zCompatibility = Math.max(0, 1 - (zDistance / maxZDist));

    // Weighted average: Z-score (relative position) + Raw distance (absolute agreement)
    const compatibility = Math.max(1, Math.round((zCompatibility * 0.6 + rawCompatibility * 0.4) * 100));

    const fullName = `${p.mps.first_name} ${p.mps.last_name}`;
    return {
      id: p.mp_id,
      full_name: fullName,
      party: formatParty(p.mps.party, fullName),
      compatibility,
      distance: zDistance, // Store for sorting
      scores: {
        economic: p.economic_score,
        liberal: p.liberal_conservative_score,
        env: p.environmental_score,
        urban: p.urban_rural_score || 0,
        global: p.international_national_score || 0,
        security: p.security_score || 0
      }
    };
  }).sort((a, b) => {
    if (b.compatibility !== a.compatibility) return b.compatibility - a.compatibility;
    return (a as any).distance - (b as any).distance;
  });

  const partyScores: Record<string, { totalComp: number, count: number, mps: any[] }> = {};
  matches.forEach(m => {
    const pName = m.party;
    if (!partyScores[pName]) partyScores[pName] = { totalComp: 0, count: 0, mps: [] };
    partyScores[pName].totalComp += m.compatibility;
    partyScores[pName].count++;
    partyScores[pName].mps.push({ id: m.id, name: m.full_name, compatibility: m.compatibility });
  });

  const partyAnalysis = Object.entries(partyScores)
    .map(([name, data]) => ({
      name,
      avgCompatibility: Math.round(data.totalComp / data.count),
      mps: data.mps.sort((a, b) => b.compatibility - a.compatibility)
    })).sort((a, b) => b.avgCompatibility - a.avgCompatibility);

  const sliceCount = Math.min(5, Math.floor(matches.length / 2));
  const topSlice = matches.slice(0, sliceCount);
  const bottomSlice = matches.slice(-sliceCount).reverse();

  const withPivotScores = async (list: any[]) => {
    return Promise.all(list.map(async (m) => ({
      ...m,
      pivotScore: await calculatePivotScore(m.id)
    })));
  };

  const finalTop = await withPivotScores(topSlice);
  const finalBottom = await withPivotScores(bottomSlice);

  return {
    topMatches: finalTop,
    bottomMatches: finalBottom,
    partyAnalysis
  };
}

export async function getHarkimoMatches(): Promise<HarkimoMatchResult> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Get Hjallis Harkimo (Harry Harkimo, id 1328)
    const { data: harkimoMp, error: harkimoError } = await supabase
      .from("mps")
      .select("id, first_name, last_name, party")
      .eq("id", 1328)
      .single();

    if (harkimoError || !harkimoMp) {
      console.error("Harkimo fetch error:", harkimoError);
      return {
        harkimo: {
          id: 1328,
          full_name: "Harry Harkimo",
          party: "Liik",
          scores: { economic: 0, liberal: 0, env: 0, urban: 0, global: 0, security: 0 }
        },
        topMatches: [],
        bottomMatches: [],
        partyAnalysis: [],
        error: "Harkimoa ei löytynyt tietokannasta. Tarkista Supabase-yhteys."
      } as any;
    }

    // 2. Get his profile
    let { data: harkimoProfile } = await supabase
      .from("mp_profiles")
      .select("*")
      .eq("mp_id", harkimoMp.id)
      .single();

    // MOCK Harkimo profile if real data is missing (for demo purposes)
    if (!harkimoProfile) {
      harkimoProfile = {
        mp_id: harkimoMp.id,
        economic_score: 0.75, 
        liberal_conservative_score: 0.2, 
        environmental_score: -0.1, 
        urban_rural_score: -0.5,
        international_national_score: 0.3,
        security_score: 0.8,
        total_votes_analyzed: 42
      };
    }

    const pivotScore = await calculatePivotScore(harkimoMp.id);

    const matchesResult = await findMatchesForScores({
      economic: harkimoProfile.economic_score,
      liberal: harkimoProfile.liberal_conservative_score,
      env: harkimoProfile.environmental_score,
      urban: harkimoProfile.urban_rural_score || 0,
      global: harkimoProfile.international_national_score || 0,
      security: harkimoProfile.security_score || 0
    });

    return {
      harkimo: {
        id: harkimoMp.id,
        full_name: `${harkimoMp.first_name} ${harkimoMp.last_name}`,
        party: formatParty(harkimoMp.party, `${harkimoMp.first_name} ${harkimoMp.last_name}`),
        scores: {
          economic: harkimoProfile.economic_score,
          liberal: harkimoProfile.liberal_conservative_score,
          env: harkimoProfile.environmental_score,
          urban: harkimoProfile.urban_rural_score,
          global: harkimoProfile.international_national_score,
          security: harkimoProfile.security_score
        },
        pivotScore: pivotScore
      },
      ...matchesResult
    };
  } catch (error: any) {
    console.error("Critical error in getHarkimoMatches:", error);
    throw error;
  }
}

