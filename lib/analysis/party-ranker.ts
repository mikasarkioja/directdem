// lib/analysis/party-ranker.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { formatParty } from "@/lib/utils/party-utils";
import { calculatePivotScore } from "@/lib/analysis/pivot-engine";

export async function calculateAndStorePartyRankings(supabase: SupabaseClient) {
  console.log("--- Lasketaan puolueiden voimasuhteet (Pre-calculation) ---");

  // 1. Fetch ALL active MP profiles
  const { data: mpData, error: mpError } = await supabase
    .from("mp_profiles")
    .select(`
      *,
      mps!inner ( id, first_name, last_name, party, is_active )
    `)
    .eq("mps.is_active", true);

  if (mpError || !mpData) {
    console.error("Virhe MP-datan haussa:", mpError?.message);
    return;
  }

  // 2. Fetch LARGE sample of voting data (e.g., last 50,000 votes)
  // Using !inner to ensure we only get votes for events that exist and have a category
  const { data: voteAgg, error: voteError } = await supabase
    .from("mp_votes")
    .select(`
      vote_type,
      event_id,
      mps!inner ( id, party, is_active, first_name, last_name ),
      voting_events!inner ( category )
    `)
    .eq("mps.is_active", true)
    .not("voting_events.category", "is", null) // Only count votes for categorized events
    .limit(50000); 

  if (voteError || !voteAgg) {
    console.error("Virhe äänten haussa:", voteError?.message);
    return;
  }

  // Group votes by party and event
  const partyVotes: Record<string, Record<string, { jaa: number; ei: number }>> = {};
  const partyActivity: Record<string, Record<string, number>> = {};
  
  voteAgg.forEach((v: any) => {
    const mp = v.mps;
    const party = formatParty(mp.party, `${mp.first_name} ${mp.last_name}`);
    const cat = v.voting_events?.category;

    if (!partyVotes[party]) partyVotes[party] = {};
    if (!partyVotes[party][v.event_id]) partyVotes[party][v.event_id] = { jaa: 0, ei: 0 };
    if (v.vote_type === 'jaa') partyVotes[party][v.event_id].jaa++;
    if (v.vote_type === 'ei') partyVotes[party][v.event_id].ei++;

    if (cat) {
      if (!partyActivity[party]) partyActivity[party] = {};
      partyActivity[party][cat] = (partyActivity[party][cat] || 0) + 1;
    }
  });

  // Rice Index
  const partyCohesion: Record<string, number> = {};
  Object.entries(partyVotes).forEach(([party, events]) => {
    let totalRice = 0;
    let eventCount = 0;
    Object.values(events).forEach(counts => {
      const total = counts.jaa + counts.ei;
      if (total > 1) {
        const rice = Math.abs(counts.jaa - counts.ei) / total;
        totalRice += rice;
        eventCount++;
      }
    });
    partyCohesion[party] = eventCount > 0 ? (totalRice / eventCount) * 100 : 0;
  });

  // Polarization
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

  const rankingsToUpsert: any[] = [];

  for (const party of Object.keys(partyProfiles)) {
    const profiles = partyProfiles[party];
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

    const vector = {
      economic: avg.eco - parliamentMedian.eco,
      liberal: avg.lib - parliamentMedian.lib,
      env: avg.env - parliamentMedian.env,
      urban: avg.urb - parliamentMedian.urb,
      global: avg.glo - parliamentMedian.glo,
      security: avg.sec - parliamentMedian.sec,
    };

    // Pivot Score - Here we can afford to calculate for ALL MPs in the script
    let totalPivot = 0;
    let pivotCount = 0;
    const mpIds = profiles.map(p => p.mp_id);
    
    console.log(`Lasketaan Pivot Score puolueelle: ${party}...`);
    for (const mpId of mpIds) {
      try {
        const score = await calculatePivotScore(mpId);
        if (score > 0) {
          totalPivot += score;
          pivotCount++;
        }
      } catch (e) {}
    }
    const avgPivot = pivotCount > 0 ? Math.round(totalPivot / pivotCount) : 0;

    // Topic Ownership Intensity - Ensure all 6 core categories are represented
    const coreCategories = ["Talous", "Arvot", "Ympäristö", "Aluepolitiikka", "Kansainvälisyys", "Turvallisuus"];
    const cats = partyActivity[party] || {};
    const topicOwnership: Record<string, number> = {};
    
    coreCategories.forEach(cat => {
      topicOwnership[cat] = (cats[cat] || 0) / profiles.length;
    });

    // Also include any other categories found
    Object.entries(cats).forEach(([cat, count]) => {
      if (!coreCategories.includes(cat)) {
        topicOwnership[cat] = count / profiles.length;
      }
    });

    const topCat = Object.entries(topicOwnership)
      .filter(([c]) => c !== 'Muu')
      .sort((a, b) => b[1] - a[1])[0]?.[0] || "Yleinen";

    const totalVotes = Object.values(cats).reduce((a, b) => a + b, 0);
    const activityScore = totalVotes / profiles.length;

    rankingsToUpsert.push({
      party_name: party,
      cohesion_score: Math.round(partyCohesion[party] || 0),
      polarization_score: Math.round(dist * 50),
      polarization_vector: vector,
      pivot_score: avgPivot,
      activity_score: activityScore,
      mp_count: profiles.length,
      topic_ownership: topicOwnership,
      top_category: topCat,
      updated_at: new Date().toISOString()
    });
  }

  const { error: upsertError } = await supabase
    .from("party_rankings")
    .upsert(rankingsToUpsert, { onConflict: "party_name" });

  if (upsertError) {
    console.error("Virhe puolueiden ranking-päivityksessä:", upsertError.message);
  } else {
    console.log(`Puolueiden voimasuhteet päivitetty (${rankingsToUpsert.length} puoluetta).`);
  }
}

