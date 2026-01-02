"use server";

import { calculateAlignment } from "@/lib/match-engine";
import type { AlignmentResult } from "@/lib/match-engine";

/**
 * Server action wrapper for calculating party alignment
 */
export async function getPartyAlignment(userId: string): Promise<AlignmentResult[]> {
  return calculateAlignment(userId);
}


