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
  
  // Create a response object first
  const redirectTo = new URL(next, origin);
  const response = NextResponse.redirect(redirectTo);

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
            // SET ON COOKIE STORE (Server-side persistence)
            cookieStore.set(name, value, { ...options, path: '/', sameSite: 'lax' });
            // SET ON RESPONSE (Browser-side persistence)
            response.cookies.set(name, value, { ...options, path: '/', sameSite: 'lax' });
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
        // Non-blocking profile update
        upsertUserProfile(data.session.user.id).catch(() => {});
        
        // Ensure success param is added to the REDIRECT response
        const finalUrl = new URL(next, origin);
        finalUrl.searchParams.set('auth', 'success');
        
        // Return the modified response object which NOW HAS THE COOKIES
        const finalResponse = NextResponse.redirect(finalUrl);
        // Copy all cookies from our 'response' helper to the final response
        response.cookies.getAll().forEach(cookie => {
          finalResponse.cookies.set(cookie.name, cookie.value, { path: '/', sameSite: 'lax' });
        });
        
        return finalResponse;
      }
    } else if (token_hash) {
      const { data, error } = await supabase.auth.verifyOtp({ token_hash, type: type as any });
      if (error) throw error;
      if (data.session) {
        upsertUserProfile(data.session.user.id).catch(() => {});
        const finalUrl = new URL(next, origin);
        finalUrl.searchParams.set('auth', 'success');
        
        const finalResponse = NextResponse.redirect(finalUrl);
        response.cookies.getAll().forEach(cookie => {
          finalResponse.cookies.set(cookie.name, cookie.value, { path: '/', sameSite: 'lax' });
        });
        
        return finalResponse;
      }
    }
    
    return NextResponse.redirect(new URL("/?error=exchange_failed", origin));
  } catch (err: any) {
    console.error("[Auth Callback] Error:", err.message);
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(err.message)}`, origin));
  }
}
