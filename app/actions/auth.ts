"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
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

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

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
 * Sends a 6-digit OTP code to the user's email
 */
export async function sendOtpAction(email: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  if (error) throw new Error(error.message);
  return { success: true };
}

/**
 * Verifies the 6-digit OTP code and forces session synchronization
 */
export async function verifyOtpCodeAction(email: string, token: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });

  if (error) throw new Error(error.message);
  if (!data.session) throw new Error("Istunnon luonti epäonnistui.");

  // Update profile with defaults
  await upsertUserProfileWithClient(supabase, data.session.user.id, {
    email: data.session.user.email,
    is_new_user: true
  });

  // CRITICAL: Force Next.js to purge all caches and recognize the new session
  revalidatePath("/", "layout");
  
  return { success: true };
}

/**
 * Internal helper that uses an existing supabase client to avoid cookie conflicts
 */
async function upsertUserProfileWithClient(supabase: any, userId: string, metadata?: any) {
  const profileData: any = {
    id: userId,
    last_login: new Date().toISOString(),
  };

  if (metadata) {
    if (metadata.accepted_terms !== undefined) profileData.accepted_terms = metadata.accepted_terms;
    if (metadata.full_name) profileData.full_name = metadata.full_name;
    if (metadata.email) profileData.email = metadata.email;
    if (metadata.is_new_user) {
      profileData.trust_score = 10;
      profileData.level = 1;
    }
  }

  await supabase.from("profiles").upsert(profileData, { onConflict: 'id' });
}

/**
 * Public profile update
 */
export async function upsertUserProfile(userId: string, metadata?: any) {
  const supabase = await createClient();
  await upsertUserProfileWithClient(supabase, userId, metadata);
  revalidatePath("/", "layout");
}
