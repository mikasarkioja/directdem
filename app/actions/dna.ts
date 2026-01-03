"use server";

import { createClient } from "@/lib/supabase/server";
import { addPartyXP } from "./parties";
import type { ArchetypePoints } from "@/lib/types";

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

export async function trackEngagement(billId: string, durationSeconds: number) {
  if (durationSeconds > 30) {
    await addDNAPoints("fact_checker", 2);
    return { success: true, message: "Faktantarkistaja-pisteitä lisätty!" };
  }
  return { success: false };
}

