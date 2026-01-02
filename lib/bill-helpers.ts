/**
 * Helper functions for bill data generation
 * These are not server actions, just utility functions
 */

import type { Bill } from "@/lib/types";

/**
 * Generates mock citizen pulse data based on issue content.
 * In production, this would come from actual polling/survey data.
 */
export function generateMockCitizenPulse(issue: { title: string; abstract?: string }): {
  for: number;
  against: number;
} {
  // Simple heuristic based on keywords in title/abstract
  const text = `${issue.title} ${issue.abstract || ""}`.toLowerCase();

  // Issues with certain keywords might have different default sentiment
  if (text.includes("palkka") || text.includes("terveys") || text.includes("sosiaaliturva")) {
    return { for: 75, against: 25 };
  }
  if (text.includes("vero") || text.includes("maksu") || text.includes("kustannus")) {
    return { for: 45, against: 55 };
  }
  if (text.includes("ympäristö") || text.includes("klimaatti") || text.includes("luonto")) {
    return { for: 70, against: 30 };
  }

  // Default: roughly balanced
  return { for: 55, against: 45 };
}

/**
 * Generates mock political reality data.
 * In production, this would come from actual voting records or party statements.
 */
export function generateMockPoliticalReality(issue?: { title: string }): Bill["politicalReality"] {
  const text = issue?.title.toLowerCase() || "";
  
  // Create different "coalition" scenarios
  const isLeftIssue = text.includes("sosiaali") || text.includes("palkka") || text.includes("työ");
  const isRightIssue = text.includes("vero") || text.includes("yritys") || text.includes("leikkaus");
  const isGreenIssue = text.includes("ympäristö") || text.includes("luonto") || text.includes("ilmasto");

  return [
    { party: "Kokoomus", position: isLeftIssue ? "against" : "for", seats: 48 },
    { party: "Perussuomalaiset", position: isLeftIssue ? "against" : "for", seats: 46 },
    { party: "SDP", position: isRightIssue ? "against" : "for", seats: 43 },
    { party: "Keskusta", position: isGreenIssue ? "against" : "for", seats: 23 },
    { party: "Vihreät", position: isRightIssue ? "against" : "for", seats: 13 },
    { party: "Vasemmistoliitto", position: isRightIssue ? "against" : "for", seats: 11 },
    { party: "RKP", position: "for", seats: 9 },
    { party: "Kristillisdemokraatit", position: "for", seats: 5 },
  ];
}

