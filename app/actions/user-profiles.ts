"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { assignToCommittee } from "@/lib/logic/committee-assigner";
import { getUser } from "./auth";

export async function getUserProfile() {
  const supabase = await createClient();
  const user = await getUser(); // Käytetään meidän uutta getUseria joka tunnistaa Ghostin

  if (!user) return null;

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*, profiles!inner(economic_score, liberal_conservative_score, environmental_score, urban_rural_score, international_national_score, security_score, full_name)")
    .eq("id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching user profile:", error);
    return null;
  }

  // Jos profiilia ei löydy TAI kyseessä on Ghost-käyttäjä, varmistetaan palautus
  if (!data || user.is_guest) {
    if (user.is_guest) {
      const { committee, rankTitle } = assignToCommittee(user);
      return {
        id: user.id,
        shadow_id_number: `GHOST-${user.id.substring(0, 4).toUpperCase()}`,
        committee_assignment: committee,
        rank_title: rankTitle,
        impact_points: user.impact_points || 0,
        xp: user.xp || 0,
        level: user.level || 1,
        active_role: user.active_role || 'citizen',
        researcher_initialized: (user as any).researcher_initialized || false,
        researcher_type: (user as any).researcher_type,
        researcher_focus: (user as any).researcher_focus,
        is_guest: true,
        economic_score: user.economic_score,
        liberal_conservative_score: user.liberal_conservative_score,
        environmental_score: user.environmental_score,
        urban_rural_score: user.urban_rural_score,
        international_national_score: user.international_national_score,
        security_score: user.security_score
      };
    }
    
    // Jos oikea käyttäjä mutta ei vielä profiilia, palautetaan tyhjä mutta tunnistettu tila
    return {
      id: user.id,
      is_new_user: true,
      active_role: user.active_role || 'citizen',
      xp: 0,
      level: 1,
      economic_score: user.economic_score,
      liberal_conservative_score: user.liberal_conservative_score,
      environmental_score: user.environmental_score,
      urban_rural_score: user.urban_rural_score,
      international_national_score: user.international_national_score,
      security_score: user.security_score
    };
  }

  // Litistetään profiles-tiedot samaan tasoon
  const profiles = data.profiles as any;
  const flattenedData = {
    ...data,
    economic_score: profiles?.economic_score,
    liberal_conservative_score: profiles?.liberal_conservative_score,
    environmental_score: profiles?.environmental_score,
    urban_rural_score: profiles?.urban_rural_score,
    international_national_score: profiles?.international_national_score,
    security_score: profiles?.security_score,
    full_name: profiles?.full_name
  };
  delete flattenedData.profiles;

  return flattenedData;
}

export async function createUserProfile() {
  const supabase = await createClient();
  const user = await getUser();

  if (!user) throw new Error("Ei kirjautunutta käyttäjää");

  // Determine committee and rank based on current DNA
  const { committee, rankTitle } = assignToCommittee(user);

  // Generate random Shadow ID
  const shadowId = `${user.is_guest ? 'GS' : 'SH'}-${Math.floor(1000 + Math.random() * 9000)}-${user.id.substring(0, 4).toUpperCase()}`;

  const profileData = {
    id: user.id,
    shadow_id_number: shadowId,
    committee_assignment: committee,
    rank_title: rankTitle,
    impact_points: 10,
    active_role: 'shadow_mp',
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from("user_profiles")
    .upsert([profileData])
    .select()
    .single();

  if (error) {
    if (user.is_guest) {
      console.log("[Ghost] Profile creation skipped due to FK, returning mock data");
      return { ...profileData, is_guest: true };
    }
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

export async function switchUserRole(role: 'citizen' | 'shadow_mp' | 'researcher'): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getUser();
    
    // 1. Tallennetaan rooli AINA evästeeseen (toimii heti ja on luotettava)
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    cookieStore.set("guest_active_role", role, {
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
    });

    // Jos ei ole kirjautunutta käyttäjää, eväste riittää
    if (!user || user.is_guest) {
      revalidatePath("/");
      return { success: true };
    }

    // 2. Yritetään tallentaa tietokantaan taustalla (jos kirjautunut)
    try {
      const adminClient = await createAdminClient();
      
      // Tarkistetaan onko käyttäjällä jo profiili
      const { data: existingProfile } = await adminClient
        .from("user_profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!existingProfile) {
        await adminClient.from("user_profiles").upsert({ 
          id: user.id, 
          active_role: role,
          rank_title: 'Kansalainen',
          impact_points: 0
        });
      } else {
        await adminClient
          .from("user_profiles")
          .update({ active_role: role })
          .eq("id", user.id);
      }
    } catch (dbError) {
      console.warn("Tietokantapäivitys epäonnistui, mutta rooli vaihdettiin evästeellä:", dbError);
    }

    revalidatePath("/");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Critical error in switchUserRole:", error);
    return { success: false, error: error?.message || "Tuntematon virhe" };
  }
}

export async function initializeResearcherProfile(data: { type: string; focus: string[] }) {
  try {
    const user = await getUser();
    if (!user) throw new Error("Ei käyttäjää");

    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    cookieStore.set("researcher_initialized", "true", { maxAge: 60 * 60 * 24 * 30, path: "/" });
    cookieStore.set("researcher_type", data.type, { maxAge: 60 * 60 * 24 * 30, path: "/" });
    cookieStore.set("researcher_focus", JSON.stringify(data.focus), { maxAge: 60 * 60 * 24 * 30, path: "/" });

    if (!user.is_guest) {
      const adminClient = await createAdminClient();
      await adminClient
        .from("user_profiles")
        .upsert({ 
          id: user.id,
          researcher_initialized: true,
          researcher_type: data.type,
          researcher_focus: data.focus,
          active_role: 'researcher',
          updated_at: new Date().toISOString()
        });
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to initialize researcher profile", error);
    return { success: false };
  }
}
