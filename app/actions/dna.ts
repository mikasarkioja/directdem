"use server";

import { createClient } from "@/lib/supabase/server";
import { addPartyXP } from "./parties";
import type { ArchetypePoints, UserProfile } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { assignToCommittee } from "@/lib/logic/committee-assigner";
import { getUser } from "./auth";
import { saveGhostDNA } from "@/lib/auth/ghost-actions";

export async function saveDNATestResults(scores: {
  economic_score: number;
  liberal_conservative_score: number;
  environmental_score: number;
  urban_rural_score: number;
  international_national_score: number;
  security_score: number;
}) {
  const user = await getUser();

  if (!user) return { success: false, error: "Ei kirjautunutta käyttäjää" };

  // 1. Jos on Ghost-käyttäjä, tallennetaan evästeeseen
  if (user.is_guest) {
    console.log("[saveDNATestResults] Saving for Ghost user...");
    await saveGhostDNA(scores);
    revalidatePath("/dashboard");
    return { success: true };
  }

  const supabase = await createClient();
  
  // 2. Update the primary profile for regular users
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      ...scores,
      updated_at: new Date().toISOString()
    })
    .eq("id", user.id);

  if (profileError) {
    console.error("[saveDNATestResults] Profile Error:", profileError);
    return { success: false, error: profileError.message };
  }

  // 2. Check if user_profiles exists and update assignment
  const { data: userProfile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (userProfile) {
    // We need the full user object to re-run assignment
    const { data: fullProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (fullProfile) {
        // Map to UserProfile type for assignToCommittee
        const mappedUser: UserProfile = {
            id: user.id,
            ...fullProfile,
            impact_points: userProfile.impact_points || 0
        };

        const { committee, rankTitle } = assignToCommittee(mappedUser);

        await supabase
            .from("user_profiles")
            .update({
                committee_assignment: committee,
                rank_title: rankTitle,
                updated_at: new Date().toISOString()
            })
            .eq("id", user.id);
    }
  }

  // 3. Clear cache and revalidate
  revalidatePath("/dashboard");
  revalidatePath("/");
  
  return { success: true };
}

export async function getDNAPoints() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("user_archetypes")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    // Return zeros if no data yet
    return {
      active: 0,
      fact_checker: 0,
      mediator: 0,
      reformer: 0,
      local_hero: 0,
    };
  }

  return {
    active: data.active_points,
    fact_checker: data.fact_checker_points,
    mediator: data.mediator_points,
    reformer: data.reformer_points,
    local_hero: data.local_hero_points,
  };
}

export async function addDNAPoints(type: keyof ArchetypePoints, points: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return;

  const column = `${type}_points`;

  // Use raw SQL or a dedicated RPC for safer incrementing, 
  // but for simplicity we'll do a read-and-update or upsert with increments
  const { data: existing } = await supabase
    .from("user_archetypes")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const updateData: any = {
    user_id: user.id,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    updateData[column] = (existing[column] || 0) + points;
  } else {
    // Initialize all to 0 except the one we're adding
    updateData.active_points = type === 'active' ? points : 0;
    updateData.fact_checker_points = type === 'fact_checker' ? points : 0;
    updateData.mediator_points = type === 'mediator' ? points : 0;
    updateData.reformer_points = type === 'reformer' ? points : 0;
    updateData.local_hero_points = type === 'local_hero' ? points : 0;
  }

  const { error } = await supabase
    .from("user_archetypes")
    .upsert(updateData);

  if (error) console.error("[addDNAPoints] Error:", error);

  // Check for party membership and add Team XP
  const { data: membership } = await supabase
    .from("party_members")
    .select("party_id")
    .eq("user_id", user.id);
  
  if (membership && membership.length > 0) {
    for (const m of membership) {
      await addPartyXP(m.party_id, points);
    }
  }

  // Check for badge unlocks
  await checkBadgeUnlocks(user.id);
}

async function checkBadgeUnlocks(userId: string) {
  const supabase = await createClient();
  
  const { data: points } = await supabase
    .from("user_archetypes")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!points) return;

  const badgesToUnlock = [];

  if (points.fact_checker_points >= 10 && points.mediator_points >= 10) {
    badgesToUnlock.push("Sivistynyt kriitikko");
  }
  
  if (points.active_points >= 50) {
    badgesToUnlock.push("Demokratian moottori");
  }

  if (points.reformer_points >= 20) {
    badgesToUnlock.push("Riippumaton ajattelija");
  }

  for (const badge of badgesToUnlock) {
    await supabase
      .from("user_badges")
      .upsert({ user_id: userId, badge_type: badge }, { onConflict: "user_id,badge_type" });
  }
}

export async function trackEngagement(billId: string, durationSeconds: number): Promise<{ success: boolean; message?: string }> {
  if (durationSeconds > 30) {
    await addDNAPoints("fact_checker", 2);
    return { success: true, message: "Faktantarkistaja-pisteitä lisätty!" };
  }
  return { success: false };
}

export async function confirmAlert(alertId: string): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Kirjaudu sisään vahvistaaksesi." };

  // Add Vigilante (Fact Checker) points
  await addDNAPoints("fact_checker", 5);
  
  return { success: true, message: "Kiitos vahvistuksesta! Sait 5 Faktantarkistaja-pistettä." };
}

