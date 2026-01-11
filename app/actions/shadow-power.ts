"use server";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "./auth";
import { getVoteStats } from "./votes";
import { revalidatePath } from "next/cache";

export interface ShadowImpactResult {
  isDecisive: boolean; // Olisiko käyttäjän ääni voinut kääntää tuloksen?
  communityInfluence: number; // Kuinka monta % DirectDem-yhteisö muuttaisi tulosta
  shadowOutcome: "passed" | "rejected" | "no_change";
  realOutcome: "passed" | "rejected";
  margin: number; // Ääni-ero todellisessa päätöksessä
  communityPower: number; // DirectDem-yhteisön koko suhteessa päätöksentekijöihin
}

/**
 * Laskee "Shadow Power" -vaikutuksen: miten käyttäjän ja yhteisön äänet
 * olisivat vaikuttaneet todelliseen päätökseen.
 */
export async function calculateShadowImpact(
  billId: string, 
  realFor: number, 
  realAgainst: number,
  context: "parliament" | "municipal" = "parliament"
): Promise<ShadowImpactResult> {
  const stats = await getVoteStats(billId);
  const totalReal = realFor + realAgainst;
  const realMargin = Math.abs(realFor - realAgainst);
  const realOutcome = realFor > realAgainst ? "passed" : "rejected";

  // Simulaatio: Mitä jos DirectDem-äänet lisättäisiin todellisiin ääniin?
  const simulatedFor = realFor + stats.for_count;
  const simulatedAgainst = realAgainst + stats.against_count;
  
  let shadowOutcome: "passed" | "rejected" | "no_change" = "no_change";
  const newOutcome = simulatedFor > simulatedAgainst ? "passed" : "rejected";
  
  if (newOutcome !== realOutcome) {
    shadowOutcome = newOutcome;
  }

  // Olisiko käyttäjän YKSI ääni voinut muuttaa tuloksen? 
  // (Jos ero on 0 tai 1 ja käyttäjä äänestää hävinnyttä puolta)
  const isDecisive = realMargin <= 1;

  // Yhteisön vaikutusvalta prosentteina todellisesta äänimäärästä
  const communityPower = totalReal > 0 ? (stats.total_count / totalReal) * 100 : 0;

  return {
    isDecisive,
    communityInfluence: Math.round(communityPower * 10) / 10,
    shadowOutcome,
    realOutcome,
    margin: realMargin,
    communityPower
  };
}

/**
 * Tallentaa Shadow Power -pisteet käyttäjälle.
 */
export async function awardShadowPowerPoints(amount: number, reason: string) {
  const user = await getUser();
  if (!user || user.is_guest) return { success: false };

  const supabase = await createClient();
  
  // Päivitetään impact_points user_profiles-taulussa
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("impact_points")
    .eq("id", user.id)
    .single();

  if (profile) {
    await supabase
      .from("user_profiles")
      .update({ 
        impact_points: (profile.impact_points || 0) + amount,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id);
  }

  revalidatePath("/dashboard");
  return { success: true };
}

