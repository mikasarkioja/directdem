"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * Initializes the current user's political DNA profile from a Member of Parliament's profile.
 * 
 * @param mpId - The personId of the MP to copy from
 */
export async function initializeProfileFromMP(mpId: number) {
  const supabase = await createClient();

  // 1. Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Sinun täytyy olla kirjautunut sisään alustaaksesi profiilin.");
  }

  // 2. Fetch MP's profile
  const { data: mpProfile, error: mpError } = await supabase
    .from("mp_profiles")
    .select(`
      *,
      mps!inner (
        first_name,
        last_name
      )
    `)
    .eq("mp_id", mpId)
    .single();

  if (mpError || !mpProfile) {
    console.error("MP profile fetch error:", mpError);
    throw new Error("Kansanedustajan profiilia ei löytynyt.");
  }

  const mpInfo = Array.isArray(mpProfile.mps) ? mpProfile.mps[0] : mpProfile.mps;
  const mpName = mpInfo ? `${mpInfo.first_name} ${mpInfo.last_name}` : "Tuntematon MP";

  // 3. Update user's profile
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      economic_score: mpProfile.economic_score,
      liberal_conservative_score: mpProfile.liberal_conservative_score,
      environmental_score: mpProfile.environmental_score,
      urban_rural_score: mpProfile.urban_rural_score,
      international_national_score: mpProfile.international_national_score,
      security_score: mpProfile.security_score,
      initialized_from_mp: `Alustettu lähteestä: ${mpName}`
    })
    .eq("id", user.id);

  if (updateError) {
    console.error("User profile update error:", updateError);
    throw new Error("Profiilin alustus epäonnistui.");
  }

  // Optional: Also initialize user_archetypes if needed, 
  // but for now we focus on the political DNA scores.

  revalidatePath("/");
  revalidatePath("/profiili");
  
  return { success: true, mpName };
}

/**
 * Fetches a limited public profile for comparison.
 */
export async function getPublicProfile(userId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, economic_score, liberal_conservative_score, environmental_score, urban_rural_score, international_national_score, security_score")
    .eq("id", userId)
    .single();

  if (error || !data) {
    console.error("Public profile fetch error:", error);
    return null;
  }

  return data;
}

