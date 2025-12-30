"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  is_verified?: boolean;
  vaalipiiri?: string;
  last_login?: string;
}

/**
 * Gets the current user with profile data
 * Uses Next.js 15 cookies() for server-side session management
 */
export async function getUser(): Promise<UserProfile | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("[getUser] Auth error:", authError);
      return null;
    }

    if (!user) {
      return null;
    }

    // Fetch profile data
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, is_verified, vaalipiiri, last_login")
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
  const supabase = await createClient();

  const profileData: any = {
    id: userId,
    last_login: new Date().toISOString(),
  };

  // If metadata contains GDPR consent, update it
  if (metadata?.gdpr_consent) {
    profileData.gdpr_consent = true;
    profileData.gdpr_consent_date = metadata.gdpr_consent_date || new Date().toISOString();
  }
  
  // Legacy support: also update accepted_terms if provided
  if (metadata?.accepted_terms) {
    profileData.accepted_terms = true;
    profileData.terms_accepted_at = metadata.terms_accepted_at || new Date().toISOString();
    // Also set GDPR consent if not already set
    if (!profileData.gdpr_consent) {
      profileData.gdpr_consent = true;
      profileData.gdpr_consent_date = metadata.terms_accepted_at || new Date().toISOString();
    }
  }

  // If metadata contains full_name, update it
  if (metadata?.full_name) {
    profileData.full_name = metadata.full_name;
  }

  const { error } = await supabase
    .from("profiles")
    .upsert(profileData, {
      onConflict: "id",
    });

  if (error) {
    console.error("Failed to upsert profile:", error);
    throw error;
  }
}

