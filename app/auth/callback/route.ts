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

  console.log("[Auth Callback] Request received:", { code: !!code, token_hash: !!token_hash, type });

  const cookieStore = await cookies();
  
  // Create the final redirect response early so we can attach cookies to it
  const successUrl = new URL(next, origin);
  successUrl.searchParams.set('auth', 'success');
  const response = NextResponse.redirect(successUrl);

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
            console.log(`[Auth Callback] Setting cookie: ${name}`);
            
            const cookieOptions = { 
              ...options, 
              path: '/', 
              sameSite: 'lax' as const,
              secure: true,
              // Explicitly NOT setting domain to let browser handle it for current host
            };
            
            // Set on both the cookie store (for this server instance) 
            // and the redirect response (for the browser)
            try {
              cookieStore.set(name, value, cookieOptions);
            } catch (e) {
              // Ignore cookie store errors in middleware/callback
            }
            response.cookies.set(name, value, cookieOptions);
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
        console.error("[Auth Callback] Exchange error:", error.message);
        throw error;
      }
      if (data.session) {
        console.log("[Auth Callback] Session created for:", data.session.user.email);
        // Fire and forget profile update
        upsertUserProfile(data.session.user.id).catch(e => console.error("[Auth Callback] Profile error:", e));
        return response;
      }
    } else if (token_hash) {
      console.log("[Auth Callback] Verifying OTP...");
      const { data, error } = await supabase.auth.verifyOtp({ token_hash, type: type as any });
      if (error) {
        console.error("[Auth Callback] OTP error:", error.message);
        throw error;
      }
      if (data.session) {
        console.log("[Auth Callback] Session created for:", data.session.user.email);
        upsertUserProfile(data.session.user.id).catch(e => console.error("[Auth Callback] Profile error:", e));
        return response;
      }
    }
    
    console.warn("[Auth Callback] No session was created");
    return NextResponse.redirect(new URL("/?error=no_session_created", origin));
  } catch (err: any) {
    console.error("[Auth Callback] Fatal error:", err.message);
    const errorUrl = new URL("/", origin);
    errorUrl.searchParams.set('error', err.message || 'unknown_auth_error');
    return NextResponse.redirect(errorUrl);
  }
}
