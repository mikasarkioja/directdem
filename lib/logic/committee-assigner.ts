import { UserProfile } from "@/lib/types";

/**
 * Assigns a user to a parliamentary committee based on their Political DNA scores.
 * If no DNA is found, assigns to "Suuri valiokunta".
 */
export function assignToCommittee(user: UserProfile): { committee: string; rankTitle: string } {
  const scores = [
    { name: "Talousvaliokunta", val: user.economic_score || 0, axis: "Talous" },
    { name: "Sivistysvaliokunta", val: user.liberal_conservative_score || 0, axis: "Arvot" },
    { name: "Ympäristövaliokunta", val: user.environmental_score || 0, axis: "Ympäristö" },
    { name: "Hallintovaliokunta", val: user.urban_rural_score || 0, axis: "Alueet" },
    { name: "Ulkoasiainvaliokunta", val: user.international_national_score || 0, axis: "Globalismi" },
    { name: "Puolustusvaliokunta", val: user.security_score || 0, axis: "Turvallisuus" },
  ];

  // Find the strongest absolute deviation from zero
  const sortedScores = [...scores].sort((a, b) => Math.abs(b.val) - Math.abs(a.val));
  const strongest = sortedScores[0];

  // If no significant DNA (all zeros or very low), default to Suuri valiokunta
  if (!strongest || Math.abs(strongest.val) < 0.1) {
    return {
      committee: "Suuri valiokunta",
      rankTitle: "Yleisjäsen"
    };
  }

  // Determine Rank Title based on impact points (simple logic for now)
  let rankTitle = "Varjokansanedustaja";
  const points = user.impact_points || 0;
  
  if (points > 1000) rankTitle = "Valtiomies";
  else if (points > 500) rankTitle = "Valiokuntaneuvos";
  else if (points > 100) rankTitle = "Erityisasiantuntija";

  return {
    committee: strongest.name,
    rankTitle: rankTitle
  };
}

