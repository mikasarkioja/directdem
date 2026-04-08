"use server";

import { getLatestBills, type EduskuntaIssue } from "@/lib/eduskunta-api";
import type { Bill } from "@/lib/types";

/**
 * Hakee lakilistan Eduskunnasta. Ei mock-rivejä: tyhjä lista jos API ei käytössä tai epäonnistuu.
 */
export async function fetchBills(useRealAPI: boolean = false): Promise<Bill[]> {
  if (!useRealAPI) {
    return [];
  }

  try {
    const eduskuntaIssues = await getLatestBills(10);
    if (eduskuntaIssues.length > 0) {
      return eduskuntaIssues.map((issue) => convertEduskuntaToBill(issue));
    }
  } catch (error) {
    console.error("[fetchBills] Eduskunta API epäonnistui:", error);
  }

  return [];
}

function convertEduskuntaToBill(issue: EduskuntaIssue): Bill {
  const statusMap: Record<string, Bill["status"]> = {
    pending: "draft",
    active: "voting",
    passed: "passed",
    rejected: "rejected",
  };

  return {
    id: issue.id,
    title: issue.title,
    summary: issue.abstract,
    rawText: issue.abstract,
    parliamentId: issue.parliamentId,
    status: statusMap[issue.status] || "in_progress",
    citizenPulse: null,
    citizenPulseSource: "none",
    politicalReality: [],
    category: issue.category,
    publishedDate: issue.publishedDate,
    url: issue.url,
  };
}
