import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { upsertUserProfile } from "@/app/actions/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") || "magiclink";
  const next = requestUrl.searchParams.get("next") ?? "/";

  const cookieStore = await cookies();

  // Create an initial response object for the redirect
  const response = NextResponse.redirect(new URL(next, request.url));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // 1. Set on the cookie store (for server-side immediate use)
            cookieStore.set(name, value, options);
            // 2. Set on the response object (for browser to receive after redirect)
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  try {
    if (code) {
      console.log("[Auth Callback] Exchanging code for session...");
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error("[Auth Callback] Code exchange error:", error.message);
        return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error.message)}`, request.url));
      }
      
      if (data.session) {
        console.log("[Auth Callback] exchangeCodeForSession SUCCESS for:", data.session.user.email);
        try {
          await upsertUserProfile(data.session.user.id);
        } catch (dbErr) {
          console.error("[Auth Callback] Profile update failed (non-fatal):", dbErr);
        }
        return response;
      }
    } else if (token_hash) {
      console.log("[Auth Callback] Verifying OTP token_hash...");
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as any,
      });
      if (error) {
        console.error("[Auth Callback] OTP verify error:", error.message);
        return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error.message)}`, request.url));
      }

      if (data.session) {
        console.log("[Auth Callback] verifyOtp SUCCESS for:", data.session.user.email);
        try {
          await upsertUserProfile(data.session.user.id);
        } catch (dbErr) {
          console.error("[Auth Callback] Profile update failed (non-fatal):", dbErr);
        }
        return response;
      }
    }
    
    console.warn("[Auth Callback] No code or token_hash found in URL.");
    return NextResponse.redirect(new URL("/?error=missing_auth_data", request.url));

  } catch (err: any) {
    console.error("[Auth Callback] Unexpected error:", err.message);
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(err.message)}`, request.url));
  }
}
