"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { cache } from "react";
import type { UserProfile } from "@/lib/types";

export const getUser = cache(async (): Promise<UserProfile | null> => {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      // TARKISTETAAN GHOST-KÄYTTÄJÄ jos oikeaa istuntoa ei löydy
      const cookieStore = await cookies();
      const guestId = cookieStore.get("guest_user_id")?.value;
      const guestName = cookieStore.get("guest_user_name")?.value;

      if (guestId) {
        console.log("[getUser] Ghost user detected:", guestId);
        
        // Haetaan mahdolliset eväste-asetukset (rooli)
        const guestRole = cookieStore.get("guest_active_role")?.value as any;

        // Haetaan profiili jos se on tietokannassa
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", guestId)
          .single();

        // Haetaan mahdolliset eväste-DNA-tulokset
        const guestDnaJson = cookieStore.get("guest_dna")?.value;
        let guestDna = null;
        try {
          guestDna = guestDnaJson ? JSON.parse(guestDnaJson) : null;
        } catch (e) {
          console.error("Failed to parse guest DNA", e);
        }

        return {
          id: guestId,
          full_name: profile?.full_name || guestName || "Ghost User",
          email: profile?.email || "guest@local",
          is_guest: true,
          active_role: guestRole || 'citizen',
          is_verified: false,
          impact_points: profile?.impact_points || 0,
          level: profile?.level || 1,
          economic_score: guestDna?.economic_score ?? profile?.economic_score ?? 0,
          liberal_conservative_score: guestDna?.liberal_conservative_score ?? profile?.liberal_conservative_score ?? 0,
          environmental_score: guestDna?.environmental_score ?? profile?.environmental_score ?? 0,
          urban_rural_score: guestDna?.urban_rural_score ?? profile?.urban_rural_score ?? 0,
          international_national_score: guestDna?.international_national_score ?? profile?.international_national_score ?? 0,
          security_score: guestDna?.security_score ?? profile?.security_score ?? 0,
          trust_score: profile?.trust_score ?? 10,
        };
      }
      return null;
    }

    console.log("[getUser] Regular user found:", user.id);

    const cookieStore = await cookies();
    const guestRole = cookieStore.get("guest_active_role")?.value as any;

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    const { data: userProfile } = await supabase.from("user_profiles").select("active_role").eq("id", user.id).single();

    return { 
      id: user.id, 
      email: user.email, 
      ...profile,
      active_role: userProfile?.active_role || guestRole || 'citizen'
    };
  } catch {
    return null;
  }
});

// Huom: Käytämme nyt pääasiassa LoginPage.tsx:n client-puolen kirjautumista,
// mutta pidetään nämä taustalla jos tarpeen.
export async function syncProfile(userId: string) {
  const supabase = await createClient();
  await supabase.from("profiles").upsert({ id: userId }, { onConflict: 'id' });
  revalidatePath("/", "layout");
}

export async function upsertUserProfile(userId: string, data: any) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userId, ...data }, { onConflict: 'id' });
  
  if (error) {
    console.error("Error upserting user profile:", error);
    throw error;
  }
  
  revalidatePath("/", "layout");
}
