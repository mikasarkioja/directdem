// lib/analysis/pivot-engine.ts
import { createClient } from "@supabase/supabase-js";

/**
 * Takinkääntö-indeksi (Pivot Score)
 * Vertaa vaalikonevastauksia (odotettu linja) ja toteutuneita äänestyksiä (todellinen linja).
 */
export async function calculatePivotScore(mpId: number): Promise<number> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Hae vaalikonevastaukset
  const { data: responses } = await supabase
    .from('mp_candidate_responses')
    .select('*')
    .eq('mp_id', mpId);

  if (!responses || responses.length === 0) return 0;

  // 2. Hae MP:n äänet ja niihin liittyvät kategoriat
  const { data: votes } = await supabase
    .from('mp_votes')
    .select(`
      vote_type,
      voting_events!inner (
        category,
        summary_ai
      )
    `)
    .eq('mp_id', mpId);

  if (!votes || votes.length === 0) return 0;

  // 3. Ryhmittele äänet kategorioittain ja laske keskiarvo
  const categoryVotes: Record<string, { sum: number, count: number }> = {};
  votes.forEach((v: any) => {
    const event = Array.isArray(v.voting_events) ? v.voting_events[0] : v.voting_events;
    const cat = event?.category;
    if (!cat || cat === 'Muu') return;

    const parts = event?.summary_ai?.split(': ');
    const aiWeight = parts?.length > 1 ? parseFloat(parts[1]) : 0;
    
    // Suunta: Jaa = 1, Ei = -1
    const voteVal = v.vote_type === 'jaa' ? 1 : v.vote_type === 'ei' ? -1 : 0;
    const score = voteVal * aiWeight;

    if (!categoryVotes[cat]) categoryVotes[cat] = { sum: 0, count: 0 };
    categoryVotes[cat].sum += score;
    categoryVotes[cat].count++;
  });

  // 4. Laske poikkeama kategorioittain
  let totalDeviation = 0;
  let comparableCategories = 0;

  // Ryhmittele vaalikonevastaukset kategorioittain
  const categoryResponses: Record<string, { sum: number, count: number }> = {};
  responses.forEach(r => {
    if (!categoryResponses[r.category]) categoryResponses[r.category] = { sum: 0, count: 0 };
    
    // Normalisoi vaalikonevastaus (1-5) -> (-1 ... 1)
    // 1 -> 1.0, 3 -> 0.0, 5 -> -1.0
    const normalized = (3 - r.response_value) / 2;
    // Käytetään painokerrointa 1.0 jos saraketta ei ole
    const weight = (r as any).weight || 1.0;
    categoryResponses[r.category].sum += normalized * weight;
    categoryResponses[r.category].count++;
  });

  Object.entries(categoryResponses).forEach(([cat, respData]) => {
    const voteData = categoryVotes[cat];
    if (!voteData || voteData.count === 0) return;

    const avgResp = respData.sum / respData.count;
    const avgVote = voteData.sum / voteData.count;

    // Poikkeama: jos suunnat ovat vastakkaiset, ero on suuri
    // Skaalaus: jos avgResp on 1 ja avgVote on -1, diff on 2. Max diff on 2.
    const diff = Math.abs(avgResp - avgVote);
    
    // Normalisoidaan diff (0-2) -> (0-100)
    totalDeviation += (diff / 2) * 100;
    comparableCategories++;
  });

  return comparableCategories > 0 ? Math.round(totalDeviation / comparableCategories) : 0;
}

