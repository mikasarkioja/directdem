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
    id: number;
    full_name: string;
    party: string;
    scores: {
      economic: number;
      liberal: number;
      env: number;
      urban: number;
      global: number;
      security: number;
    };
    pivotScore: number;
  };
  topMatches: MPMatch[];
  bottomMatches: MPMatch[];
  partyAnalysis: {
    name: string;
    avgCompatibility: number;
  }[];
  error?: string;
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

    // 3. Get all other profiles (ONLY ACTIVE ONES)
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
      .eq("mps.is_active", true)
      .neq("mp_id", harkimoMp.id);

    if (profilesError || !allProfiles || allProfiles.length === 0) {
      console.log("No other MP profiles found or error:", profilesError);
      return {
        harkimo: {
          id: harkimoMp.id,
          full_name: `${harkimoMp.first_name} ${harkimoMp.last_name}`,
          party: formatParty(harkimoMp.party, `${harkimoMp.first_name} ${harkimoMp.last_name}`),
          scores: {
            economic: harkimoProfile.economic_score,
            liberal: harkimoProfile.liberal_conservative_score,
            env: harkimoProfile.environmental_score,
            urban: harkimoProfile.urban_rural_score || 0,
            global: harkimoProfile.international_national_score || 0,
            security: harkimoProfile.security_score || 0
          }
        },
        topMatches: [],
        bottomMatches: [],
        partyAnalysis: []
      };
    }

    // Deduplicate profiles by MP ID just in case
    const uniqueProfiles = Array.from(new Map(allProfiles.map(p => [p.mps.id, p])).values());

    // 4. Calculate Statistics for Normalization (relative to current parliament)
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

    // Avoid division by zero
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
      eco: Math.sqrt(Math.max(0.01, stats.eco.sqSum / count - Math.pow(means.eco, 2))),
      lib: Math.sqrt(Math.max(0.01, stats.lib.sqSum / count - Math.pow(means.lib, 2))),
      env: Math.sqrt(Math.max(0.01, stats.env.sqSum / count - Math.pow(means.env, 2))),
      urb: Math.sqrt(Math.max(0.01, stats.urb.sqSum / count - Math.pow(means.urb, 2))),
      glo: Math.sqrt(Math.max(0.01, stats.glo.sqSum / count - Math.pow(means.glo, 2))),
      sec: Math.sqrt(Math.max(0.01, stats.sec.sqSum / count - Math.pow(means.sec, 2)))
    };

    const getZ = (val: number, mean: number, sd: number) => (val - mean) / sd;

    // 5. Calculate Euclidean distance and compatibility using Z-scores
    const matches = uniqueProfiles.map((p: any) => {
      const dEco = getZ(p.economic_score, means.eco, stdDevs.eco) - getZ(harkimoProfile.economic_score, means.eco, stdDevs.eco);
      const dLib = getZ(p.liberal_conservative_score, means.lib, stdDevs.lib) - getZ(harkimoProfile.liberal_conservative_score, means.lib, stdDevs.lib);
      const dEnv = getZ(p.environmental_score, means.env, stdDevs.env) - getZ(harkimoProfile.environmental_score, means.env, stdDevs.env);
      const dUrb = getZ(p.urban_rural_score || 0, means.urb, stdDevs.urb) - getZ(harkimoProfile.urban_rural_score || 0, means.urb, stdDevs.urb);
      const dGlo = getZ(p.international_national_score || 0, means.glo, stdDevs.glo) - getZ(harkimoProfile.international_national_score || 0, means.glo, stdDevs.glo);
      const dSec = getZ(p.security_score || 0, means.sec, stdDevs.sec) - getZ(harkimoProfile.security_score || 0, means.sec, stdDevs.sec);

      const distance = Math.sqrt(
        Math.pow(dEco, 2) + Math.pow(dLib, 2) + Math.pow(dEnv, 2) +
        Math.pow(dUrb, 2) + Math.pow(dGlo, 2) + Math.pow(dSec, 2)
      );

      // normalizedDist: 0 is same, ~10 is very far
      const maxZDist = 10.0; 
      const normalizedDist = Math.min(1, distance / maxZDist);
      
      // (1 - x)^1.5 curve: better balance between high allies and distinct opposites
      const compatibility = Math.max(0, Math.round(Math.pow(1 - normalizedDist, 1.5) * 100));

      const fullName = `${p.mps.first_name} ${p.mps.last_name}`;
      return {
        id: p.mp_id,
        full_name: fullName,
        party: formatParty(p.mps.party, fullName),
        compatibility,
        scores: {
          economic: p.economic_score,
          liberal: p.liberal_conservative_score,
          env: p.environmental_score,
          urban: p.urban_rural_score || 0,
          global: p.international_national_score || 0,
          security: p.security_score || 0
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

    const partyAnalysis = Object.entries(partyScores)
      .filter(([name]) => name !== 'N/A' && name !== 'Sit') // Poistetaan epärelevantit kategoriat
      .map(([name, data]) => ({
        name,
        avgCompatibility: Math.round(data.totalComp / data.count)
      })).sort((a, b) => b.avgCompatibility - a.avgCompatibility);

    // Ensure we don't have overlapping matches if the list is short
    const sliceCount = Math.min(5, Math.floor(matches.length / 2));
    
    const pivotScore = await calculatePivotScore(harkimoMp.id);
    
    // Calculate pivot scores for the top and bottom matches only (for performance)
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
      topMatches: finalTop,
      bottomMatches: finalBottom,
      partyAnalysis: partyAnalysis // Return all parties
    };
  } catch (error: any) {
    console.error("Critical error in getHarkimoMatches:", error);
    throw error;
  }
}

