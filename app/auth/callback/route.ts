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
  const origin = requestUrl.origin;

  const cookieStore = await cookies();
  
  // 1. Prepare the final URL
  const successUrl = new URL(next, origin);
  successUrl.searchParams.set('auth', 'success');
  
  // 2. Create the response object FIRST and use it throughout
  const response = NextResponse.redirect(successUrl);

  // 3. Initialize Supabase client bound to THIS specific response
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
            // Set on the current cookie store for immediate server use
            try {
              cookieStore.set(name, value, { ...options, path: '/', sameSite: 'lax', secure: true });
            } catch (e) { /* Ignore read-only errors */ }
            
            // Set on the actual response that goes to the browser
            response.cookies.set(name, value, { 
              ...options, 
              path: '/', 
              sameSite: 'lax', 
              secure: true,
              maxAge: 60 * 60 * 24 * 7 // Ensure 1 week persistence
            });
          });
        },
      },
    }
  );

  try {
    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
      if (data.session) {
        // Essential: upsert happens but don't block the redirect
        upsertUserProfile(data.session.user.id).catch(() => {});
        return response; // Return the response that now has cookies attached
      }
    } else if (token_hash) {
      const { data, error } = await supabase.auth.verifyOtp({ token_hash, type: type as any });
      if (error) throw error;
      if (data.session) {
        upsertUserProfile(data.session.user.id).catch(() => {});
        return response;
      }
    }
    
    return NextResponse.redirect(new URL("/?error=no_session_created", origin));
  } catch (err: any) {
    console.error("[Auth Callback] Error:", err.message);
    const errorUrl = new URL("/", origin);
    errorUrl.searchParams.set('error', err.message);
    return NextResponse.redirect(errorUrl);
  }
}
