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

  // Create a base response for redirects
  const cookieStore = await cookies();
  const redirectTo = new URL(next, request.url);
  
  // Use a temporary response to collect cookies from Supabase
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
            // 1. Set on the incoming request cookies (for immediate server-side state)
            cookieStore.set(name, value, { ...options, path: '/', sameSite: 'lax' });
            // 2. Set on the outgoing response (for the browser to save them)
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
        await upsertUserProfile(data.session.user.id).catch(() => {});
        // Add success flag to URL
        redirectTo.searchParams.set('auth', 'success');
        return NextResponse.redirect(redirectTo, {
          headers: response.headers // Ensure cookies are included in the final redirect
        });
      }
    } else if (token_hash) {
      const { data, error } = await supabase.auth.verifyOtp({ token_hash, type: type as any });
      if (error) throw error;
      
      if (data.session) {
        await upsertUserProfile(data.session.user.id).catch(() => {});
        redirectTo.searchParams.set('auth', 'success');
        return NextResponse.redirect(redirectTo, {
          headers: response.headers
        });
      }
    }
    
    return NextResponse.redirect(new URL("/?error=no_session_created", request.url));
  } catch (err: any) {
    console.error("[Auth Callback] Error:", err.message);
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(err.message)}`, request.url));
  }
}
