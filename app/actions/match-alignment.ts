"use server";

import { calculateAlignment, type AlignmentResult } from "@/lib/match-engine";

/**
 * Server action wrapper for calculating party alignment
 */
export async function getPartyAlignment(userId: string): Promise<AlignmentResult[]> {
  return calculateAlignment(userId);
}

