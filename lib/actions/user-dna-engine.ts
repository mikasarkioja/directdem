"use server";

import { createClient } from "@/lib/supabase/server";
import { generateProfileSummary } from "@/lib/utils/profile-describer";
import { revalidatePath } from "next/cache";

/**
 * Updates user's political DNA scores based on their vote
 * and saves a snapshot to user_profile_history.
 */
export async function updateUserPoliticalDNA(billId: string, position: "for" | "against" | "neutral") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // 1. Get Bill Info (Category and potentially AI weights)
  const { data: bill } = await supabase
    .from("bills")
    .select("category")
    .eq("id", billId)
    .single();

  if (!bill || !bill.category || bill.category === "Muu" || position === "neutral") {
    // If neutral or no category, just save snapshot of CURRENT state
    await saveDNAHistorySnapshot(user.id);
    return;
  }

  // 2. Get current profile scores
  const { data: profile } = await supabase
    .from("profiles")
    .select("economic_score, liberal_conservative_score, environmental_score, urban_rural_score, international_national_score, security_score")
    .eq("id", user.id)
    .single();

  if (!profile) return;

  // 3. Calculate new scores
  // Simple logic: a vote changes the specific axis by a small amount (e.g. 0.05)
  const delta = 0.05;
  const direction = position === "for" ? 1 : -1;
  const change = delta * direction;

  const newScores = {
    economic_score: profile.economic_score || 0,
    liberal_conservative_score: profile.liberal_conservative_score || 0,
    environmental_score: profile.environmental_score || 0,
    urban_rural_score: profile.urban_rural_score || 0,
    international_national_score: profile.international_national_score || 0,
    security_score: profile.security_score || 0
  };

  // Map category to axis
  if (bill.category === "Talous") newScores.economic_score = clamp(newScores.economic_score + change);
  if (bill.category === "Arvot") newScores.liberal_conservative_score = clamp(newScores.liberal_conservative_score + change);
  if (bill.category === "Ympäristö") newScores.environmental_score = clamp(newScores.environmental_score + change);
  if (bill.category === "Aluepolitiikka") newScores.urban_rural_score = clamp(newScores.urban_rural_score + change);
  if (bill.category === "Kansainvälisyys") newScores.international_national_score = clamp(newScores.international_national_score + change);
  if (bill.category === "Turvallisuus") newScores.security_score = clamp(newScores.security_score + change);

  // 4. Update Profile
  await supabase
    .from("profiles")
    .update(newScores)
    .eq("id", user.id);

  // 5. Save Snapshot
  await saveDNAHistorySnapshot(user.id, newScores);

  revalidatePath("/profiili");
}

function clamp(val: number) {
  return Math.max(-1, Math.min(1, val));
}

async function saveDNAHistorySnapshot(userId: string, scores?: any) {
  const supabase = await createClient();
  
  let currentScores = scores;
  if (!currentScores) {
    const { data } = await supabase
      .from("profiles")
      .select("economic_score, liberal_conservative_score, environmental_score, urban_rural_score, international_national_score, security_score")
      .eq("id", userId)
      .single();
    currentScores = data;
  }

  if (!currentScores) return;

  const summary = generateProfileSummary({
    economic: currentScores.economic_score,
    liberal: currentScores.liberal_conservative_score,
    env: currentScores.environmental_score,
    urban: currentScores.urban_rural_score,
    global: currentScores.international_national_score,
    security: currentScores.security_score
  });

  await supabase.from("user_profile_history").insert({
    user_id: userId,
    scores_json: currentScores,
    archetype: summary.title
  });
}

export async function getUserDNAHistory() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("user_profile_history")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  return data || [];
}


