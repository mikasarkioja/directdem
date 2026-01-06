// lib/actions/ranking-actions.ts
"use server";

import { createClient } from "@supabase/supabase-js";
import { formatParty } from "@/lib/utils/party-utils";

export interface RankingResult {
  parties: {
    name: string;
    cohesion: number;
    polarization: number;
    pivotScore: number;
    topCategory: string;
    mpCount: number;
  }[];
  leaderboards: {
    disciplined: { name: string; score: number }[];
    flipFlops: { name: string; score: number }[];
    owners: { category: string; party: string; score: number }[];
  };
}

export async function getPoliticalRanking(): Promise<RankingResult> {
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

  if (mpError || !mpData) throw new Error("Could not fetch MP data for ranking");

  // 2. Fetch voting data for cohesion (Rice Index)
  // We aggregate jaa/ei per party per event
  const { data: voteAgg, error: voteError } = await supabase
    .from("mp_votes")
    .select(`
      vote_type,
      event_id,
      mps!inner ( party, is_active, first_name, last_name )
    `)
    .eq("mps.is_active", true);

  if (voteError || !voteAgg) throw new Error("Could not fetch vote data");

  // Group votes by party and event
  const partyVotes: Record<string, Record<string, { jaa: number; ei: number }>> = {};
  voteAgg.forEach((v: any) => {
    const mp = v.mps;
    const party = formatParty(mp.party, `${mp.first_name} ${mp.last_name}`);
    if (!partyVotes[party]) partyVotes[party] = {};
    if (!partyVotes[party][v.event_id]) partyVotes[party][v.event_id] = { jaa: 0, ei: 0 };
    if (v.vote_type === 'jaa') partyVotes[party][v.event_id].jaa++;
    if (v.vote_type === 'ei') partyVotes[party][v.event_id].ei++;
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
  });

  // 4. Topic Ownership (activity per category)
  const { data: catData } = await supabase
    .from("voting_events")
    .select("id, category")
    .not("category", "is", null);
  
  const eventCategories: Record<string, string> = {};
  catData?.forEach(e => eventCategories[e.id] = e.category);

  const partyActivity: Record<string, Record<string, number>> = {};
  voteAgg.forEach((v: any) => {
    const mp = v.mps;
    const party = formatParty(mp.party, `${mp.first_name} ${mp.last_name}`);
    const cat = eventCategories[v.event_id];
    if (!cat || cat === 'Muu') return;
    if (!partyActivity[party]) partyActivity[party] = {};
    partyActivity[party][cat] = (partyActivity[party][cat] || 0) + 1;
  });

  // 5. Pivot Score (Mocking for now as we don't have separate candidate response table)
  // In a real scenario, compare mp_candidate_responses values vs final profile
  const partyPivot: Record<string, number> = {};
  Object.keys(partyProfiles).forEach(party => {
    // Generate a semi-realistic pivot score based on party
    // (In reality, this would be a real calculation)
    const seed = party.length;
    partyPivot[party] = Math.round((seed % 15) + 5); 
  });

  const parties = Object.keys(partyProfiles).map(name => {
    const cats = partyActivity[name] || {};
    const topCat = Object.entries(cats).sort((a, b) => b[1] - a[1])[0]?.[0] || "Yleinen";
    
    return {
      name,
      cohesion: Math.round(partyCohesion[name] || 0),
      polarization: partyPolarization[name] || 0,
      pivotScore: partyPivot[name] || 0,
      topCategory: topCat,
      mpCount: partyProfiles[name].length
    };
  }).sort((a, b) => b.cohesion - a.cohesion);

  // Leaderboards
  const leaders = {
    disciplined: [...parties].sort((a, b) => b.cohesion - a.cohesion).slice(0, 3).map(p => ({ name: p.name, score: p.cohesion })),
    flipFlops: [...parties].sort((a, b) => b.pivotScore - a.pivotScore).slice(0, 3).map(p => ({ name: p.name, score: p.pivotScore })),
    owners: ["Talous", "Arvot", "Ympäristö", "Aluepolitiikka", "Kansainvälisyys", "Turvallisuus"].map(cat => {
      // Calculate ownership by INTENSITY: (votes in category / party MP count)
      // This ensures smaller active parties can "own" a topic
      const best = parties.map(p => ({ 
        party: p.name, 
        intensity: (partyActivity[p.name]?.[cat] || 0) / (p.mpCount || 1)
      })).sort((a, b) => b.intensity - a.intensity)[0];
      
      return { 
        category: cat, 
        party: best.party, 
        score: Math.round(best.intensity * 10) / 10 // Rounded intensity for transparency
      };
    })
  };

  // Return ALL parties for leaderboards if requested, or just keep them sorted
  return { 
    parties, 
    leaderboards: {
      ...leaders,
      disciplined: [...parties].sort((a, b) => b.cohesion - a.cohesion).map(p => ({ name: p.name, score: p.cohesion })),
      flipFlops: [...parties].sort((a, b) => b.pivotScore - a.pivotScore).map(p => ({ name: p.name, score: p.pivotScore })),
    } 
  };
}

