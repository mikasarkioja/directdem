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

  // Create response first to set cookies on it
  const response = NextResponse.redirect(new URL(next, request.url));
  
  const cookieStore = await cookies();

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
            cookieStore.set(name, value, options);
            // Also set on response for immediate effect during redirect
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
      if (error) throw error;
      
      if (data.session) {
        console.log("[Auth Callback] exchangeCodeForSession SUCCESS.");
        await upsertUserProfile(data.session.user.id);
        return response;
      }
    } else if (token_hash) {
      console.log("[Auth Callback] Verifying OTP token_hash...");
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as any,
      });
      if (error) throw error;

      if (data.session) {
        console.log("[Auth Callback] verifyOtp SUCCESS.");
        await upsertUserProfile(data.session.user.id);
        return response;
      }
    }
  } catch (err: any) {
    console.error("[Auth Callback] Auth error:", err.message);
  }

  // If something fails, redirect home but maybe with an error flag
  return NextResponse.redirect(new URL("/?error=auth_failed", request.url));
}
