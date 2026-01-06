"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Ei kirjautunutta käyttäjää");

  // Generoidaan satunnainen Shadow ID
  const shadowId = `SH-${Math.floor(1000 + Math.random() * 9000)}-${user.id.substring(0, 4).toUpperCase()}`;

  const { data, error } = await supabase
    .from("user_profiles")
    .insert([
      {
        id: user.id,
        shadow_id_number: shadowId,
        committee_assignment: "Sivistysvaliokunta", // Oletusvaliokunta
        impact_points: 10,
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

