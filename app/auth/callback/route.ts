import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { upsertUserProfile } from "@/app/actions/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";
  const origin = requestUrl.origin;

  // Use cookies() from next/headers - this is the source of truth in Next.js 15
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
            // Force strict settings for Vercel persistence
            cookieStore.set(name, value, { 
              ...options, 
              path: '/', 
              sameSite: 'lax', 
              secure: true 
            });
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
        console.error("[Auth Callback] Exchange Error:", error.message);
        return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error.message)}`, origin));
      }

      if (data.session) {
        console.log("[Auth Callback] Session secured, updating profile...");
        // Non-blocking profile update
        upsertUserProfile(data.session.user.id).catch(() => {});
        
        // Final success redirect
        const successUrl = new URL(next, origin);
        successUrl.searchParams.set('auth', 'success');
        return NextResponse.redirect(successUrl);
      }
    }
    
    console.warn("[Auth Callback] No code provided or session failed");
    return NextResponse.redirect(new URL("/?error=auth_failed_no_session", origin));
  } catch (err: any) {
    console.error("[Auth Callback] Fatal Exception:", err.message);
    return NextResponse.redirect(new URL(`/?error=fatal_error`, origin));
  }
}
