"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import type { UserProfile } from "@/lib/types";

/**
 * Gets the current user with profile data
 */
export async function getUser(): Promise<UserProfile | null> {
  try {
    const supabase = await createClient();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    // Fetch profile data
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("[getUser] Profile error:", profileError);
    }

    return {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name || null,
      is_verified: profile?.is_verified || false,
      vaalipiiri: profile?.vaalipiiri || null,
      municipality: profile?.municipality || null,
      last_login: profile?.last_login || null,
      impact_points: profile?.impact_points || 0,
      xp: profile?.xp || 0,
      level: profile?.level || 1,
      economic_score: profile?.economic_score || 0,
      liberal_conservative_score: profile?.liberal_conservative_score || 0,
      environmental_score: profile?.environmental_score || 0,
      urban_rural_score: profile?.urban_rural_score || 0,
      international_national_score: profile?.international_national_score || 0,
      security_score: profile?.security_score || 0,
      initialized_from_mp: profile?.initialized_from_mp || null,
      trust_score: profile?.trust_score || 50,
      organization_tag: profile?.organization_tag || null,
    };
  } catch (error: any) {
    return null;
  }
}

/**
 * Creates or updates user profile after login
 * Optimized to NOT interfere with auth cookies
 */
export async function upsertUserProfile(userId: string) {
  try {
    // We use a direct client here to avoid any cookie side-effects during auth callback
    const supabase = await createClient();
    
    await supabase.from("profiles").upsert({
      id: userId,
      last_login: new Date().toISOString(),
    }, { onConflict: 'id' });
    
  } catch (err: any) {
    console.error("[upsertUserProfile] Error:", err.message);
  }
}

/**
 * Verifies OTP on the server side
 */
export async function verifyOtpAction(token_hash: string, type: any) {
  const supabase = await createClient();
  
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash,
    type,
  });

  if (error) throw error;
  if (!data.session) throw new Error("Istunnon luonti epäonnistui.");

  // Profile update is secondary, don't let it block
  upsertUserProfile(data.session.user.id).catch(() => {});

  return { success: true };
}
