// lib/actions/party-analysis.ts
"use server";

import { createClient } from "@supabase/supabase-js";
import { formatParty } from "@/lib/utils/party-utils";
import { calculatePivotScore } from "@/lib/analysis/pivot-engine";

export interface PartyAnalysisData {
  name: string;
  pivotScore: number;
  riceIndex: number;
  topCategories: string[];
  mpCount: number;
  aiInsight: string;
  mps: { id: number; name: string }[];
}

export async function getPartyAnalysis(): Promise<PartyAnalysisData[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Hae kaikki aktiiviset MP:t ja heidän puolueensa
  const { data: mpsData } = await supabase
    .from('mps')
    .select('id, party, first_name, last_name')
    .eq('is_active', true);

  if (!mpsData) return [];

  // Ryhmittele MP:t puolueittain
  const parties: Record<string, { ids: number[], mps: { id: number; name: string }[] }> = {};
  mpsData.forEach(mp => {
    const pName = formatParty(mp.party);
    if (!parties[pName]) parties[pName] = { ids: [], mps: [] };
    parties[pName].ids.push(mp.id);
    parties[pName].mps.push({ id: mp.id, name: `${mp.first_name} ${mp.last_name}` });
  });

  // 2. Laske Rice Index ja Topic Ownership (tämä on raskasta, haetaan kootusti)
  const { data: votes } = await supabase
    .from('mp_votes')
    .select(`
      vote_type,
      event_id,
      mps!inner ( party, is_active ),
      voting_events!inner ( category )
    `)
    .eq('mps.is_active', true);

  if (!votes) return [];

  const analysis: PartyAnalysisData[] = [];

  for (const [pName, partyData] of Object.entries(parties)) {
    const mpIds = partyData.ids;
    // Rice Index
    const pVotes = votes.filter(v => formatParty((v as any).mps.party) === pName);
    const votesByEvent: Record<string, { jaa: number, ei: number }> = {};
    pVotes.forEach(v => {
      if (!votesByEvent[v.event_id]) votesByEvent[v.event_id] = { jaa: 0, ei: 0 };
      if (v.vote_type === 'jaa') votesByEvent[v.event_id].jaa++;
      if (v.vote_type === 'ei') votesByEvent[v.event_id].ei++;
    });

    let totalRice = 0;
    let eventCount = 0;
    Object.values(votesByEvent).forEach(counts => {
      const total = counts.jaa + counts.ei;
      if (total > 1) {
        totalRice += Math.abs(counts.jaa - counts.ei) / total;
        eventCount++;
      }
    });
    const riceIndex = eventCount > 0 ? (totalRice / eventCount) * 100 : 0;

    // Topic Ownership
    const catCounts: Record<string, number> = {};
    pVotes.forEach(v => {
      const cat = (v as any).voting_events.category;
      if (cat && cat !== 'Muu') {
        catCounts[cat] = (catCounts[cat] || 0) + 1;
      }
    });
    const topCategories = Object.entries(catCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);

    // Pivot Score (Keskiarvo edustajilta)
    // Huom: oikeasti tämä pitäisi laskea taustalla ja tallentaa, mutta tässä lasketaan livenä parhaimmille
    let totalPivot = 0;
    let pivotCount = 0;
    // Lasketaan vain otos (esim. 5 edustajaa) nopeuden vuoksi demossa
    for (const mpId of mpIds.slice(0, 5)) {
      const score = await calculatePivotScore(mpId);
      if (score > 0) {
        totalPivot += score;
        pivotCount++;
      }
    }
    const avgPivot = pivotCount > 0 ? Math.round(totalPivot / pivotCount) : 0;

    // AI Insight (Sääntöpohjainen "AI" demossa)
    let insight = "";
    if (avgPivot < 15 && riceIndex > 90) {
      insight = "Tämä puolue osoittaa poikkeuksellista ideologista yhtenäisyyttä ja lupauksista kiinnipitämistä.";
    } else if (avgPivot > 30) {
      insight = "Puolueen linja on joustanut merkittävästi hallitusvastuun tai pragmaattisten kompromissien myötä.";
    } else if (riceIndex < 80) {
      insight = "Puolueen sisällä on havaittavissa merkittävää hajontaa ja edustajien yksilöllistä vapautta.";
    } else {
      insight = "Puolue noudattaa vakiintunutta parlamentaarista linjaa ilman suuria yllätyksiä.";
    }

    analysis.push({
      name: pName,
      pivotScore: avgPivot,
      riceIndex: Math.round(riceIndex),
      topCategories,
      mpCount: mpIds.length,
      aiInsight: insight,
      mps: partyData.mps.sort((a, b) => a.name.localeCompare(b.name))
    });
  }

  return analysis.sort((a, b) => a.pivotScore - b.pivotScore);
}

