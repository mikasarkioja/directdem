import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { upsertUserProfile } from "@/app/actions/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") || "magiclink";
  const next = searchParams.get("next") ?? "/";

  // 1. Create the base response early
  const redirectTo = new URL(next, origin);
  redirectTo.searchParams.set('auth', 'success');
  const response = NextResponse.redirect(redirectTo);

  const cookieStore = await cookies();

  // 2. Setup Supabase with explicit cookie handling bound to our response
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
            // Set on both the store and the redirect response
            cookieStore.set(name, value, { ...options, path: '/', sameSite: 'lax' });
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
        // NON-BLOCKING profile update
        upsertUserProfile(data.session.user.id).catch(() => {});
        return response;
      }
    } else if (token_hash) {
      const { data, error } = await supabase.auth.verifyOtp({ token_hash, type: type as any });
      if (error) throw error;
      if (data.session) {
        upsertUserProfile(data.session.user.id).catch(() => {});
        return response;
      }
    }
    
    return NextResponse.redirect(new URL("/?error=no_session_found", origin));
  } catch (err: any) {
    console.error("[Auth Callback] Error:", err.message);
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(err.message)}`, origin));
  }
}
