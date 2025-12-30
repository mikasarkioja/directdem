import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { upsertUserProfile } from "@/app/actions/auth";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Create or update user profile
      try {
        await upsertUserProfile(data.user.id, {
          gdpr_consent: data.user.user_metadata?.gdpr_consent || data.user.user_metadata?.accepted_terms,
          gdpr_consent_date: data.user.user_metadata?.gdpr_consent_date || data.user.user_metadata?.terms_accepted_at,
          full_name: data.user.user_metadata?.full_name,
        });
      } catch (profileError) {
        console.error("Failed to create/update profile:", profileError);
        // Continue anyway - profile will be created by trigger if needed
      }
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}

