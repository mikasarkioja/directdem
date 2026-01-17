"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { UserProfile } from "@/lib/types";

export async function getUser(): Promise<UserProfile | null> {
  try {
    const { cookies } = await import("next/headers");
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.warn("[getUser] Supabase auth error:", authError.message);
      
      // DEBUG: Yritetään hakea session jos user epäonnistui
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log("[getUser] Session found even though getUser failed. Access token length:", session.access_token.length);
      } else {
        console.warn("[getUser] Also session is missing.");
      }
    }

    const cookieStore = await cookies();

    if (!user) {
      // TARKISTETAAN GHOST-KÄYTTÄJÄ jos oikeaa istuntoa ei löydy
      const guestId = cookieStore.get("guest_user_id")?.value;
      const guestName = cookieStore.get("guest_user_name")?.value;

      if (guestId) {
        console.log("[getUser] Ghost user detected:", guestId);
        
        // Haetaan mahdolliset eväste-asetukset (rooli ja tutkija)
        const guestRole = cookieStore.get("guest_active_role")?.value as any;
        const researcherInitialized = cookieStore.get("researcher_initialized")?.value === "true";
        const researcherType = cookieStore.get("researcher_type")?.value;
        const researcherFocusJson = cookieStore.get("researcher_focus")?.value;
        let researcherFocus = [];
        try {
          researcherFocus = researcherFocusJson ? JSON.parse(researcherFocusJson) : [];
        } catch (e) {}

        // Haetaan profiili jos se on tietokannassa
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", guestId)
          .single();

        const { data: userProfile } = await supabase
          .from("user_profiles")
          .select("credits, impact_points, active_role, subscription_status, plan_type")
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
          active_role: userProfile?.active_role || guestRole || 'citizen',
          is_verified: false,
          impact_points: userProfile?.impact_points || profile?.impact_points || 0,
          credits: userProfile?.credits ?? 100,
          subscription_status: userProfile?.subscription_status || 'inactive',
          plan_type: userProfile?.plan_type || 'free',
          level: profile?.level || 1,
          economic_score: guestDna?.economic_score ?? profile?.economic_score ?? 0,
          liberal_conservative_score: guestDna?.liberal_conservative_score ?? profile?.liberal_conservative_score ?? 0,
          environmental_score: guestDna?.environmental_score ?? profile?.environmental_score ?? 0,
          urban_rural_score: guestDna?.urban_rural_score ?? profile?.urban_rural_score ?? 0,
          international_national_score: guestDna?.international_national_score ?? profile?.international_national_score ?? 0,
          security_score: guestDna?.security_score ?? profile?.security_score ?? 0,
          trust_score: profile?.trust_score ?? 10,
          researcher_initialized: researcherInitialized,
          researcher_type: researcherType as any,
          researcher_focus: researcherFocus,
        };
      }
      return null;
    }

    console.log("[getUser] Regular user found:", user.id);

    // PUHDISTUS: Jos olemme kirjautuneet oikeasti, poistetaan ghost-evästeet häiritsemästä
    // Tehdään tämä vain jos ollaan debug- tai profiilisivulla, jotta ei tehdä turhia delete-kutsuja joka välissä
    const guestId = cookieStore.get("guest_user_id")?.value;
    
    if (guestId) {
      console.log("[getUser] Authenticated user has ghost cookie, clearing...");
      cookieStore.delete("guest_user_id");
      cookieStore.delete("guest_user_name");
      cookieStore.delete("guest_dna");
    }

    const guestRole = cookieStore.get("guest_active_role")?.value as any;

    let { data: profile, error: profileFetchError } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    
    // Jos profiilia ei löydy, yritetään luoda se (varmistetaan että jokaisella auth-käyttäjällä on profiili)
    if (!profile || profileFetchError) {
      console.log("[getUser] Profile missing for auth user, creating default...");
      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .upsert({ 
          id: user.id, 
          full_name: user.email?.split('@')[0] || "Uusi käyttäjä",
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' })
        .select()
        .single();
      
      if (!createError && newProfile) {
        profile = newProfile;
      }
    }

    const { data: userProfile } = await supabase.from("user_profiles").select("active_role, credits, impact_points, subscription_status, plan_type, stripe_customer_id, xp, level").eq("id", user.id).single();

    return { 
      id: user.id, 
      email: user.email, 
      full_name: profile?.full_name || user.email?.split('@')[0] || "Uusi käyttäjä",
      ...profile,
      active_role: userProfile?.active_role || guestRole || 'citizen',
      credits: userProfile?.credits ?? 100,
      impact_points: userProfile?.impact_points ?? (profile?.impact_points || 0),
      subscription_status: userProfile?.subscription_status || 'inactive',
      plan_type: userProfile?.plan_type || 'free',
      stripe_customer_id: userProfile?.stripe_customer_id,
      xp: userProfile?.xp ?? 0,
      level: userProfile?.level ?? 1
    };
  } catch {
    return null;
  }
}

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
