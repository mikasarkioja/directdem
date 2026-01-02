"use server";

import { analyzePartyStances } from "@/lib/party-stances";
import type { PartyStanceResult } from "@/lib/party-stances";

/**
 * Server action to analyze party stances for a bill
 */
export async function getPartyStances(
  billId: string,
  parliamentId: string
): Promise<PartyStanceResult | null> {
  try {
    return await analyzePartyStances(billId, parliamentId);
  } catch (error) {
    console.error("[getPartyStances] Error:", error);
    return null;
  }
}


