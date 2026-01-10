import { UserProfile } from "@/lib/types";

/**
 * Maps DNA scores to a parliamentary committee.
 * @param dnaScores [Talous, Arvot, Ympäristö, Alueet, KV, Turva]
 */
export function assignCommittee(dnaScores: number[] | null | undefined): string {
  if (!dnaScores || dnaScores.length < 6) return "Suuri valiokunta";

  const committees = [
    "Valtiovarainvaliokunta",       // Index 0: Talous
    "Sivistysvaliokunta",          // Index 1: Arvot
    "Ympäristövaliokunta",         // Index 2: Ympäristö
    "Maa- ja metsätalousvaliokunta", // Index 3: Alueet
    "Ulkoasiainvaliokunta",        // Index 4: KV
    "Puolustusvaliokunta"          // Index 5: Turva
  ];

  // Find the highest score
  let maxScore = -Infinity;
  let maxIndices: number[] = [];

  for (let i = 0; i < 6; i++) {
    if (dnaScores[i] > maxScore) {
      maxScore = dnaScores[i];
      maxIndices = [i];
    } else if (dnaScores[i] === maxScore && maxScore !== -Infinity) {
      maxIndices.push(i);
    }
  }

  // Tie or no scores (all same or all very low could be handled here)
  if (maxIndices.length > 1 || maxScore <= 0) {
    return "Suuri valiokunta";
  }

  return committees[maxIndices[0]];
}

/**
 * Assigns a user to a parliamentary committee based on their Political DNA scores.
 * If no DNA is found, assigns to "Suuri valiokunta".
 */
export function assignToCommittee(user: UserProfile): { committee: string; rankTitle: string } {
  // Map current UserProfile fields to the dnaScores array
  const dnaScores = [
    user.economic_score || 0,
    user.liberal_conservative_score || 0,
    user.environmental_score || 0,
    user.urban_rural_score || 0,
    user.international_national_score || 0,
    user.security_score || 0
  ];

  const committee = assignCommittee(dnaScores);
  
  // Determine Rank Title based on impact points (simple logic for now)
  let rankTitle = "Varjokansanedustaja";
  const points = user.impact_points || 0;
  
  if (points > 1000) rankTitle = "Valtiomies";
  else if (points > 500) rankTitle = "Valiokuntaneuvos";
  else if (points > 100) rankTitle = "Erityisasiantuntija";

  return {
    committee: committee,
    rankTitle: rankTitle
  };
}


