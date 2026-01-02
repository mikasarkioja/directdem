import { createClient } from "@/lib/supabase/server";
import { analyzePartyStances } from "@/lib/party-stances";
import type { PartyStanceData } from "@/lib/party-stances";

export interface UserVote {
  billId: string;
  billTitle: string;
  parliamentId: string;
  position: "for" | "against" | "neutral";
}

export interface PartySignal {
  party: string;
  billId: string;
  billTitle: string;
  stance: "PRO" | "AGAINST" | "ABSTAIN" | "UNKNOWN";
  confidence: number;
}

export interface AlignmentResult {
  party: string;
  score: number; // 0-100 percentage
  totalBills: number;
  agreements: number;
  disagreements: number;
  neutralMatches: number;
  topAgreements: Array<{
    billTitle: string;
    parliamentId: string;
    userPosition: string;
    partyStance: string;
  }>;
  topClashes: Array<{
    billTitle: string;
    parliamentId: string;
    userPosition: string;
    partyStance: string;
  }>;
}

/**
 * Fetches all user votes from the database
 */
async function getUserVotes(userId: string): Promise<UserVote[]> {
  const supabase = await createClient();
  
  const { data: votes, error } = await supabase
    .from("votes")
    .select(`
      bill_id,
      position,
      bills!inner (
        id,
        title,
        parliament_id
      )
    `)
    .eq("user_id", userId);

  if (error) {
    console.error("[MatchEngine] Error fetching user votes:", error);
    return [];
  }

  return (votes || []).map((vote: any) => ({
    billId: vote.bill_id,
    billTitle: vote.bills?.title || "Unknown",
    parliamentId: vote.bills?.parliament_id || "",
    position: vote.position,
  }));
}

/**
 * Fetches or calculates party stances for bills
 */
async function getPartySignals(billIds: string[], parliamentIds: string[]): Promise<PartySignal[]> {
  const signals: PartySignal[] = [];
  
  // For each bill, get party stances
  for (let i = 0; i < billIds.length; i++) {
    const billId = billIds[i];
    const parliamentId = parliamentIds[i];
    
    if (!parliamentId) continue;
    
    try {
      // Analyze party stances for this bill
      const stanceResult = await analyzePartyStances(billId, parliamentId);
      
      // Get bill title
      const supabase = await createClient();
      const { data: bill } = await supabase
        .from("bills")
        .select("title")
        .eq("id", billId)
        .single();
      
      const billTitle = bill?.title || "Unknown";
      
      // Convert party stances to signals
      stanceResult.parties.forEach((partyStance) => {
        signals.push({
          party: partyStance.party,
          billId,
          billTitle,
          stance: partyStance.stance,
          confidence: partyStance.confidence,
        });
      });
    } catch (error) {
      console.error(`[MatchEngine] Error getting party signals for ${parliamentId}:`, error);
    }
  }
  
  return signals;
}

/**
 * Maps user position to party stance for comparison
 */
function mapPositionToStance(position: "for" | "against" | "neutral"): "PRO" | "AGAINST" | "ABSTAIN" {
  if (position === "for") return "PRO";
  if (position === "against") return "AGAINST";
  return "ABSTAIN";
}

/**
 * Calculates alignment score between user position and party stance
 * Returns: 1 for agreement, 0.5 for neutral match, 0 for disagreement
 */
function calculateMatchScore(
  userPosition: "for" | "against" | "neutral",
  partyStance: "PRO" | "AGAINST" | "ABSTAIN" | "UNKNOWN"
): number {
  const userStance = mapPositionToStance(userPosition);
  
  // Exact match
  if (userStance === partyStance) {
    return 1.0;
  }
  
  // Neutral matches (user neutral, party has stance OR user has stance, party neutral)
  if (userPosition === "neutral" || partyStance === "ABSTAIN") {
    return 0.5;
  }
  
  // Direct opposition (PRO vs AGAINST or vice versa)
  if (
    (userStance === "PRO" && partyStance === "AGAINST") ||
    (userStance === "AGAINST" && partyStance === "PRO")
  ) {
    return 0.0;
  }
  
  // Unknown stance
  if (partyStance === "UNKNOWN") {
    return 0.5; // Neutral score for unknown
  }
  
  return 0.5; // Default neutral
}

/**
 * Main function: Calculates alignment between user votes and party stances
 */
export async function calculateAlignment(userId: string): Promise<AlignmentResult[]> {
  console.log(`[MatchEngine] Calculating alignment for user: ${userId}`);
  
  // 1. Get all user votes
  const userVotes = await getUserVotes(userId);
  console.log(`[MatchEngine] Found ${userVotes.length} user votes`);
  
  if (userVotes.length === 0) {
    return [];
  }
  
  // 2. Get party signals for all bills the user voted on
  const billIds = userVotes.map(v => v.billId);
  const parliamentIds = userVotes.map(v => v.parliamentId);
  const partySignals = await getPartySignals(billIds, parliamentIds);
  console.log(`[MatchEngine] Found ${partySignals.length} party signals`);
  
  // 3. Group signals by party
  const signalsByParty: Record<string, PartySignal[]> = {};
  partySignals.forEach(signal => {
    if (!signalsByParty[signal.party]) {
      signalsByParty[signal.party] = [];
    }
    signalsByParty[signal.party].push(signal);
  });
  
  // 4. Calculate alignment for each party
  const results: AlignmentResult[] = [];
  
  for (const [party, signals] of Object.entries(signalsByParty)) {
    let totalScore = 0;
    let agreements = 0;
    let disagreements = 0;
    let neutralMatches = 0;
    const agreementDetails: Array<{
      billTitle: string;
      parliamentId: string;
      userPosition: string;
      partyStance: string;
    }> = [];
    const clashDetails: Array<{
      billTitle: string;
      parliamentId: string;
      userPosition: string;
      partyStance: string;
    }> = [];
    
    // For each signal, find matching user vote
    signals.forEach(signal => {
      const userVote = userVotes.find(v => v.billId === signal.billId);
      if (!userVote) return;
      
      const score = calculateMatchScore(userVote.position, signal.stance);
      totalScore += score;
      
      if (score === 1.0) {
        agreements++;
        agreementDetails.push({
          billTitle: signal.billTitle,
          parliamentId: signal.billId,
          userPosition: userVote.position === "for" ? "Puolesta" : userVote.position === "against" ? "Vastaan" : "Neutraali",
          partyStance: signal.stance === "PRO" ? "Puolesta" : signal.stance === "AGAINST" ? "Vastaan" : "Tyhjää",
        });
      } else if (score === 0.0) {
        disagreements++;
        clashDetails.push({
          billTitle: signal.billTitle,
          parliamentId: signal.billId,
          userPosition: userVote.position === "for" ? "Puolesta" : userVote.position === "against" ? "Vastaan" : "Neutraali",
          partyStance: signal.stance === "PRO" ? "Puolesta" : signal.stance === "AGAINST" ? "Vastaan" : "Tyhjää",
        });
      } else {
        neutralMatches++;
      }
    });
    
    // Calculate percentage score
    const totalBills = signals.length;
    const percentageScore = totalBills > 0 ? Math.round((totalScore / totalBills) * 100) : 0;
    
    // Sort and get top 3 (keep most recent/relevant first)
    // For now, just take first 3 (could be improved with date sorting)
    
    results.push({
      party,
      score: percentageScore,
      totalBills,
      agreements,
      disagreements,
      neutralMatches,
      topAgreements: agreementDetails.slice(0, 3),
      topClashes: clashDetails.slice(0, 3),
    });
  }
  
  // 5. Sort by score (highest first)
  results.sort((a, b) => b.score - a.score);
  
  console.log(`[MatchEngine] Calculated alignment for ${results.length} parties`);
  return results;
}

