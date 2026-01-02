"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import type { UserProfile } from "@/lib/types";

/**
 * Gets the current user with profile data
 * Uses Next.js 15 cookies() for server-side session management
 */
export async function getUser(): Promise<UserProfile | null> {
  try {
    const supabase = await createClient();
    
    // Debug: Check session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (session) {
      console.log("[getUser] Session found for:", session.user.email);
    } else if (sessionError) {
      console.error("[getUser] Session error:", sessionError.message);
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      if (authError.name === 'AuthSessionMissingError') {
        console.log("[getUser] No session found (normal for unauthenticated users)");
      } else {
        console.error("[getUser] Auth error details:", authError);
      }
      return null;
    }

    if (!user) {
      console.log("[getUser] No user found in session despite no error");
      return null;
    }

    console.log("[getUser] Authenticated user found:", user.email);

  // Fetch profile data
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, is_verified, vaalipiiri, last_login, join_report_list")
    .eq("id", user.id)
    .single();

    // If profile doesn't exist, that's okay - return user without profile data
    if (profileError && profileError.code !== "PGRST116") {
      // PGRST116 = no rows returned, which is fine for new users
      console.error("[getUser] Profile error:", profileError);
    }

  return {
    id: user.id,
    email: user.email,
    full_name: profile?.full_name || null,
    is_verified: profile?.is_verified || false,
    vaalipiiri: profile?.vaalipiiri || null,
    last_login: profile?.last_login || null,
    join_report_list: profile?.join_report_list || false,
  };
  } catch (error: any) {
    // Catch any unexpected errors (network issues, etc.)
    console.error("[getUser] Unexpected error:", error);
    return null;
  }
}

/**
 * Creates or updates user profile after login
 */
export async function upsertUserProfile(userId: string, metadata?: any) {
  try {
    const supabase = await createClient();

    const profileData: any = {
      id: userId,
      last_login: new Date().toISOString(),
    };

    // If metadata contains full_name, update it
    if (metadata?.full_name) {
      profileData.full_name = metadata.full_name;
    }

    // If metadata contains join_report_list, update it
    if (metadata?.join_report_list !== undefined) {
      profileData.join_report_list = metadata.join_report_list;
    }

    // Simplified GDPR update - avoid non-existent columns
    if (metadata?.gdpr_consent) {
      profileData.gdpr_consent = true;
      // Removed gdpr_consent_date until column is confirmed
    }

    const { error } = await supabase
      .from("profiles")
      .upsert(profileData, {
        onConflict: "id",
      });

    if (error) {
      // Silently log only to avoid confusing the user during this phase
      console.log("[upsertUserProfile] Deferred profile update (normal during initial login)");
    }
  } catch (err: any) {
    console.error("[upsertUserProfile] Unexpected Error:", err.message);
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

  if (error) {
    console.error("[verifyOtpAction] Error:", error.message);
    throw error;
  }

  // Pakotetaan evästeiden päivitys kutsumalla getUser
  await supabase.auth.getUser();

  return data;
}

