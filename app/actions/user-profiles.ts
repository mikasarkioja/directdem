"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { assignToCommittee } from "@/lib/logic/committee-assigner";
import { getUser } from "./auth";

export async function getUserProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching user profile:", error);
    return null;
  }

  return data;
}

export async function createUserProfile() {
  const supabase = await createClient();
  const user = await getUser();

  if (!user) throw new Error("Ei kirjautunutta käyttäjää");

  // Determine committee and rank based on current DNA
  const { committee, rankTitle } = assignToCommittee(user);

  // Generate random Shadow ID
  const shadowId = `SH-${Math.floor(1000 + Math.random() * 9000)}-${user.id.substring(0, 4).toUpperCase()}`;

  const { data, error } = await supabase
    .from("user_profiles")
    .upsert([
      {
        id: user.id,
        shadow_id_number: shadowId,
        committee_assignment: committee,
        rank_title: rankTitle,
        impact_points: 10,
        updated_at: new Date().toISOString()
      }
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating user profile:", error);
    throw new Error("Profiilin luonti epäonnistui");
  }

  revalidatePath("/dashboard");
  return data;
}

export async function addImpactPoints(points: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Use a simple RPC or direct update
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("impact_points")
    .eq("id", user.id)
    .single();

  const currentPoints = profile?.impact_points || 0;

  await supabase
    .from("user_profiles")
    .update({ impact_points: currentPoints + points })
    .eq("id", user.id);

  revalidatePath("/dashboard");
}
