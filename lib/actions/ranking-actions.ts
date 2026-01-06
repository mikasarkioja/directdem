// lib/actions/ranking-actions.ts
"use server";

import { createClient } from "@supabase/supabase-js";
import { formatParty } from "@/lib/utils/party-utils";
import { calculatePivotScore } from "@/lib/analysis/pivot-engine";

export interface RankingResult {
  parties: {
    name: string;
    cohesion: number;
    polarization: number;
    polarizationVector: {
      economic: number;
      liberal: number;
      env: number;
      urban: number;
      global: number;
      security: number;
    };
    pivotScore: number;
    topCategory: string;
    mpCount: number;
  }[];
  leaderboards: {
    disciplined: { name: string; score: number }[];
    flipFlops: { name: string; score: number }[];
    owners: { category: string; party: string; score: number }[];
    activity: { name: string; score: number }[];
  };
}

export async function getPoliticalRanking(): Promise<RankingResult> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Fetch active MP profiles and their parties
    const { data: mpData, error: mpError } = await supabase
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

    if (mpError || !mpData) throw new Error("Could not fetch MP data: " + mpError?.message);

    // 2. Fetch voting data for cohesion (Rice Index) and activity
    // Fetching 10,000 most recent votes for performance on Vercel
    const { data: voteAgg, error: voteError } = await supabase
      .from("mp_votes")
      .select(`
        vote_type,
        event_id,
        mps!inner ( id, party, is_active, first_name, last_name ),
        voting_events!inner ( category )
      `)
      .eq("mps.is_active", true)
      .order('created_at', { ascending: false })
      .limit(10000);

    if (voteError || !voteAgg) throw new Error("Could not fetch vote data: " + voteError?.message);

  // Group votes by party and event
  const partyVotes: Record<string, Record<string, { jaa: number; ei: number }>> = {};
  const partyActivity: Record<string, Record<string, number>> = {};
  
  voteAgg.forEach((v: any) => {
    const mp = v.mps;
    const party = formatParty(mp.party, `${mp.first_name} ${mp.last_name}`);
    const cat = v.voting_events?.category;

    // Cohesion tracking
    if (!partyVotes[party]) partyVotes[party] = {};
    if (!partyVotes[party][v.event_id]) partyVotes[party][v.event_id] = { jaa: 0, ei: 0 };
    if (v.vote_type === 'jaa') partyVotes[party][v.event_id].jaa++;
    if (v.vote_type === 'ei') partyVotes[party][v.event_id].ei++;

    // Activity tracking (for all categories including Muu)
    if (cat) {
      if (!partyActivity[party]) partyActivity[party] = {};
      partyActivity[party][cat] = (partyActivity[party][cat] || 0) + 1;
    }
  });

  // Calculate Rice Index per party (average across all events)
  const partyCohesion: Record<string, number> = {};
  Object.entries(partyVotes).forEach(([party, events]) => {
    let totalRice = 0;
    let eventCount = 0;
    Object.values(events).forEach(counts => {
      const total = counts.jaa + counts.ei;
      if (total > 1) { // Only count if at least 2 members voted
        const rice = Math.abs(counts.jaa - counts.ei) / total;
        totalRice += rice;
        eventCount++;
      }
    });
    partyCohesion[party] = eventCount > 0 ? (totalRice / eventCount) * 100 : 0;
  });

  // 3. Polarization (distance from parliament median)
  const allScores = {
    eco: mpData.map(p => p.economic_score),
    lib: mpData.map(p => p.liberal_conservative_score),
    env: mpData.map(p => p.environmental_score),
    urb: mpData.map(p => p.urban_rural_score || 0),
    glo: mpData.map(p => p.international_national_score || 0),
    sec: mpData.map(p => p.security_score || 0),
  };

  const median = (arr: number[]) => {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  const parliamentMedian = {
    eco: median(allScores.eco),
    lib: median(allScores.lib),
    env: median(allScores.env),
    urb: median(allScores.urb),
    glo: median(allScores.glo),
    sec: median(allScores.sec),
  };

  const partyProfiles: Record<string, any[]> = {};
  mpData.forEach(p => {
    const mp = p.mps;
    const party = formatParty(mp.party, `${mp.first_name} ${mp.last_name}`);
    if (!partyProfiles[party]) partyProfiles[party] = [];
    partyProfiles[party].push(p);
  });

  const partyPolarization: Record<string, number> = {};
  Object.entries(partyProfiles).forEach(([party, profiles]) => {
    const avg = {
      eco: profiles.reduce((sum, p) => sum + p.economic_score, 0) / profiles.length,
      lib: profiles.reduce((sum, p) => sum + p.liberal_conservative_score, 0) / profiles.length,
      env: profiles.reduce((sum, p) => sum + p.environmental_score, 0) / profiles.length,
      urb: profiles.reduce((sum, p) => sum + (p.urban_rural_score || 0), 0) / profiles.length,
      glo: profiles.reduce((sum, p) => sum + (p.international_national_score || 0), 0) / profiles.length,
      sec: profiles.reduce((sum, p) => sum + (p.security_score || 0), 0) / profiles.length,
    };

    const dist = Math.sqrt(
      Math.pow(avg.eco - parliamentMedian.eco, 2) +
      Math.pow(avg.lib - parliamentMedian.lib, 2) +
      Math.pow(avg.env - parliamentMedian.env, 2) +
      Math.pow(avg.urb - parliamentMedian.urb, 2) +
      Math.pow(avg.glo - parliamentMedian.glo, 2) +
      Math.pow(avg.sec - parliamentMedian.sec, 2)
    );
    partyPolarization[party] = Math.round(dist * 50); // Scale for UI
    
    (partyPolarization as any)[`${party}_vector`] = {
      economic: avg.eco - parliamentMedian.eco,
      liberal: avg.lib - parliamentMedian.lib,
      env: avg.env - parliamentMedian.env,
      urban: avg.urb - parliamentMedian.urb,
      global: avg.glo - parliamentMedian.glo,
      security: avg.sec - parliamentMedian.sec,
    };
  });

  // 4. Topic Ownership (activity per category)
  // Use the categories actually present in our sample
  const availableCategories = Array.from(new Set(voteAgg.map((v: any) => v.voting_events?.category).filter(c => c && c !== 'Muu')));
  const displayCategories = availableCategories.length > 0 ? availableCategories : ["Talous", "Arvot", "Ympäristö", "Aluepolitiikka", "Kansainvälisyys", "Turvallisuus"];

  // 5. Pivot Score (Using actual engine)
  const partyPivot: Record<string, number> = {};
  for (const party of Object.keys(partyProfiles)) {
    const mpIds = partyProfiles[party].map(p => p.mp_id);
    let totalPivot = 0;
    let pivotCount = 0;
    
    // Reduce sample size to 3 per party for Vercel performance (prevent timeout)
    for (const mpId of mpIds.slice(0, 3)) {
      try {
        const score = await calculatePivotScore(mpId);
        if (score > 0) {
          totalPivot += score;
          pivotCount++;
        }
      } catch (e) {
        console.error(`Error calculating pivot for MP ${mpId}:`, e);
      }
    }
    partyPivot[party] = pivotCount > 0 ? Math.round(totalPivot / pivotCount) : 0;
  }

  const parties = Object.keys(partyProfiles).map(name => {
    const cats = partyActivity[name] || {};
    const topCat = Object.entries(cats).filter(([c]) => c !== 'Muu').sort((a, b) => b[1] - a[1])[0]?.[0] || "Yleinen";
    
    return {
      name,
      cohesion: Math.round(partyCohesion[name] || 0),
      polarization: partyPolarization[name] || 0,
      polarizationVector: (partyPolarization as any)[`${name}_vector`],
      pivotScore: partyPivot[name] || 0,
      topCategory: topCat,
      mpCount: partyProfiles[name].length
    };
  }).sort((a, b) => b.cohesion - a.cohesion);

  // Leaderboards
  const leaders = {
    disciplined: [...parties].sort((a, b) => b.cohesion - a.cohesion).map(p => ({ name: p.name, score: p.cohesion })),
    flipFlops: [...parties].sort((a, b) => b.pivotScore - a.pivotScore).map(p => ({ name: p.name, score: p.pivotScore })),
    activity: Object.entries(partyActivity).map(([name, cats]) => ({
      name,
      score: Math.round(Object.values(cats).reduce((a, b) => a + b, 0) / (partyProfiles[name]?.length || 1))
    })).sort((a, b) => b.score - a.score),
    owners: displayCategories.sort().map(cat => {
      // Calculate ownership by INTENSITY: (votes in category / party MP count)
      const partyOwnership = parties.map(p => ({ 
        party: p.name, 
        intensity: (partyActivity[p.name]?.[cat] || 0) / (p.mpCount || 1)
      })).sort((a, b) => b.intensity - a.intensity);
      
      const best = partyOwnership[0];
      
      return { 
        category: cat as string, 
        party: best?.intensity > 0 ? best.party : "Ei dataa", 
        score: best ? Math.round(best.intensity * 10) / 10 : 0
      };
    })
  };

  // Return ALL parties for leaderboards if requested, or just keep them sorted
  return { 
    parties, 
    leaderboards: leaders
  };
 } catch (error: any) {
    console.error("Critical error in getPoliticalRanking:", error);
    // Return empty result instead of crashing
    return {
      parties: [],
      leaderboards: {
        disciplined: [],
        flipFlops: [],
        owners: [],
        activity: []
      }
    };
  }
}

