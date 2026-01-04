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

  // Create redirect response
  const response = NextResponse.redirect(new URL(next, requestUrl.origin));
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Create a special client for this handler that updates our redirect response
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.headers.get('cookie')?.split(';').map(c => {
          const [name, ...value] = c.trim().split('=');
          return { name, value: value.join('=') };
        }) ?? [];
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        cookiesToSet.forEach(({ name, value, options }) => {
          // Explicitly set cookies on the redirect response
          response.cookies.set(name, value, {
            ...options,
            // Ensure cookies work on localhost
            secure: requestUrl.hostname === 'localhost' ? false : options?.secure,
          });
        });
      },
    },
  });

  try {
    if (code) {
      console.log("[Auth Callback] Exchanging code for session...");
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data.session) {
        console.log("[Auth Callback] exchangeCodeForSession SUCCESS.");
        await upsertUserProfile(data.session.user.id);
        return response;
      }
      if (error) console.error("[Auth Callback] exchangeCodeForSession error:", error.message);
    } else if (token_hash) {
      console.log("[Auth Callback] Verifying OTP token_hash...");
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as any,
      });

      if (!error && data.session) {
        console.log("[Auth Callback] verifyOtp SUCCESS.");
        await upsertUserProfile(data.session.user.id);
        return response;
      }
      if (error) console.error("[Auth Callback] verifyOtp error:", error.message);
    }
  } catch (err) {
    console.error("[Auth Callback] Unexpected error:", err);
  }

  // Fallback redirect if something fails
  return NextResponse.redirect(new URL("/", requestUrl.origin));
}
