"use server";

import { getLatestBills, type EduskuntaIssue } from "@/lib/eduskunta-api";
import { generateMockCitizenPulse, generateMockPoliticalReality } from "@/lib/bill-helpers";
import type { Bill } from "@/lib/types";

// Re-export Bill type for backward compatibility
export type { Bill };

/**
 * Fetches bills from Eduskunta API and converts them to our Bill format.
 * Falls back to mock data if API fails.
 * 
 * @param useRealAPI - Set to true to fetch from Eduskunta API (default: false for MVP)
 */
export async function fetchBills(useRealAPI: boolean = false): Promise<Bill[]> {
  // Try to fetch from real API if enabled
  if (useRealAPI) {
    try {
      const eduskuntaIssues = await getLatestBills(10);
      
      if (eduskuntaIssues.length > 0) {
        return eduskuntaIssues.map((issue) => convertEduskuntaToBill(issue));
      }
    } catch (error) {
      console.error("Failed to fetch from Eduskunta API, falling back to mock data:", error);
    }
  }

  // Fallback to mock data (for MVP/demo)
  await new Promise((resolve) => setTimeout(resolve, 500));

  return [
    {
      id: "1",
      title: "Alcohol Law Amendment",
      summary: "Proposes to extend alcohol sales hours in grocery stores and allow stronger beverages. Aims to modernize alcohol regulations while maintaining public health safeguards.",
      status: "voting",
      citizenPulse: {
        for: 68,
        against: 32,
      },
      politicalReality: [
        { party: "Kokoomus", position: "for", seats: 48 },
        { party: "Perussuomalaiset", position: "for", seats: 46 },
        { party: "SDP", position: "against", seats: 43 },
        { party: "Keskusta", position: "abstain", seats: 23 },
        { party: "Vihreät", position: "against", seats: 13 },
        { party: "Vasemmistoliitto", position: "against", seats: 11 },
        { party: "RKP", position: "for", seats: 9 },
        { party: "Kristillisdemokraatit", position: "against", seats: 5 },
      ],
    },
    {
      id: "2",
      title: "NATO Infrastructure Funding",
      summary: "Allocates 2.3 billion euros for military infrastructure improvements to meet NATO commitments. Includes upgrades to air bases and naval facilities across Finland.",
      status: "in_progress",
      citizenPulse: {
        for: 45,
        against: 55,
      },
      politicalReality: [
        { party: "Kokoomus", position: "for", seats: 48 },
        { party: "Perussuomalaiset", position: "for", seats: 46 },
        { party: "SDP", position: "for", seats: 43 },
        { party: "Keskusta", position: "for", seats: 23 },
        { party: "Vihreät", position: "abstain", seats: 13 },
        { party: "Vasemmistoliitto", position: "against", seats: 11 },
        { party: "RKP", position: "for", seats: 9 },
        { party: "Kristillisdemokraatit", position: "for", seats: 5 },
      ],
    },
    {
      id: "3",
      title: "Climate Action Tax Reform",
      summary: "Introduces carbon pricing for industrial emissions and redirects revenue to green technology subsidies. Part of Finland's commitment to carbon neutrality by 2035.",
      status: "voting",
      citizenPulse: {
        for: 72,
        against: 28,
      },
      politicalReality: [
        { party: "Kokoomus", position: "abstain", seats: 48 },
        { party: "Perussuomalaiset", position: "against", seats: 46 },
        { party: "SDP", position: "for", seats: 43 },
        { party: "Keskusta", position: "for", seats: 23 },
        { party: "Vihreät", position: "for", seats: 13 },
        { party: "Vasemmistoliitto", position: "for", seats: 11 },
        { party: "RKP", position: "for", seats: 9 },
        { party: "Kristillisdemokraatit", position: "abstain", seats: 5 },
      ],
    },
    {
      id: "4",
      title: "Healthcare Worker Salary Increase",
      summary: "Mandates a 12% salary increase for nurses and healthcare workers over the next two years. Addresses workforce shortages in the public healthcare system.",
      status: "draft",
      citizenPulse: {
        for: 85,
        against: 15,
      },
      politicalReality: [
        { party: "Kokoomus", position: "against", seats: 48 },
        { party: "Perussuomalaiset", position: "abstain", seats: 46 },
        { party: "SDP", position: "for", seats: 43 },
        { party: "Keskusta", position: "for", seats: 23 },
        { party: "Vihreät", position: "for", seats: 13 },
        { party: "Vasemmistoliitto", position: "for", seats: 11 },
        { party: "RKP", position: "for", seats: 9 },
        { party: "Kristillisdemokraatit", position: "for", seats: 5 },
      ],
    },
    {
      id: "5",
      title: "Digital Identity Act",
      summary: "Establishes a national digital identity system for secure online services. Includes privacy protections and opt-out mechanisms for citizens.",
      status: "in_progress",
      citizenPulse: {
        for: 38,
        against: 62,
      },
      politicalReality: [
        { party: "Kokoomus", position: "for", seats: 48 },
        { party: "Perussuomalaiset", position: "against", seats: 46 },
        { party: "SDP", position: "for", seats: 43 },
        { party: "Keskusta", position: "for", seats: 23 },
        { party: "Vihreät", position: "for", seats: 13 },
        { party: "Vasemmistoliitto", position: "against", seats: 11 },
        { party: "RKP", position: "for", seats: 9 },
        { party: "Kristillisdemokraatit", position: "abstain", seats: 5 },
      ],
    },
  ];
}

/**
 * Converts an Eduskunta issue to our internal Bill format.
 * Generates mock citizen pulse and political reality data.
 */
function convertEduskuntaToBill(issue: EduskuntaIssue): Bill {
  // Map Eduskunta status to our status format
  const statusMap: Record<string, Bill["status"]> = {
    pending: "draft",
    active: "voting",
    passed: "passed",
    rejected: "rejected",
  };

  // Generate mock citizen pulse (in production, this would come from polling data)
  const mockCitizenPulse = generateMockCitizenPulse(issue);
  
  // Generate mock political reality (in production, this would come from voting records)
  const mockPoliticalReality = generateMockPoliticalReality();

  return {
    id: issue.id,
    title: issue.title,
    summary: issue.abstract,
    rawText: issue.abstract, // Use abstract as raw text for AI processing
    parliamentId: issue.parliamentId,
    status: statusMap[issue.status] || "in_progress",
    citizenPulse: mockCitizenPulse,
    politicalReality: mockPoliticalReality,
  };
}

// Helper functions moved to lib/bill-helpers.ts
// They are not server actions, so they can't be exported from app/actions/


