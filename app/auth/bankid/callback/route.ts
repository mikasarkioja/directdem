import { NextRequest, NextResponse } from "next/server";
import { processBankIDCallback } from "@/lib/bankid-auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const error = requestUrl.searchParams.get("error");

  if (error) {
    console.error("[BankID] Authentication error:", error);
    return NextResponse.redirect(
      new URL(`/?error=bankid_${error}`, requestUrl.origin)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/?error=bankid_no_code", requestUrl.origin)
    );
  }

  try {
    // Process BankID callback (mock in development)
    const bankIDUser = await processBankIDCallback(code, state || "");

    if (!bankIDUser.email) {
      throw new Error("BankID did not provide email");
    }

    const supabase = await createClient();

    // For BankID, we'll use magic link to sign in/create user
    // In production, you'd use Supabase Admin API with service role key
    // For now, send a magic link that will create the user if needed
    const { data: magicLinkData, error: magicLinkError } = await supabase.auth.signInWithOtp({
      email: bankIDUser.email,
      options: {
        emailRedirectTo: `${requestUrl.origin}/auth/callback`,
        data: {
          given_name: bankIDUser.given_name,
          family_name: bankIDUser.family_name,
          full_name: bankIDUser.full_name,
          sub: bankIDUser.sub, // Store subject ID for future reference
          birthdate: bankIDUser.birthdate,
          is_verified: bankIDUser.is_verified,
          auth_provider: "bankid",
          gdpr_consent: false, // Will show GDPR screen
        },
      },
    });

    if (magicLinkError) {
      throw new Error(`Failed to create session: ${magicLinkError.message}`);
    }

    // In production with Admin API, you would:
    // 1. Check if user exists by email (using Admin API)
    // 2. Create user if doesn't exist with verified email
    // 3. Create session directly
    // 4. Update profile with BankID data

    // For now, redirect to a page explaining they need to check email
    // In production, this would be seamless
    return NextResponse.redirect(
      new URL(`/?bankid_pending=true&email=${encodeURIComponent(bankIDUser.email)}`, requestUrl.origin)
    );
  } catch (error: any) {
    console.error("[BankID] Callback error:", error);
    return NextResponse.redirect(
      new URL(`/?error=bankid_callback_failed&message=${encodeURIComponent(error.message)}`, requestUrl.origin)
    );
  }
}

