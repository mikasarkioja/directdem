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

  if (code || token_hash) {
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

    let error = null;
    let userId = null;

    if (code) {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      error = exchangeError;
      userId = data.session?.user.id;
    } else if (token_hash) {
      const { data, error: otpError } = await supabase.auth.verifyOtp({ token_hash, type: type as any });
      error = otpError;
      userId = data.session?.user.id;
    }

    if (!error && userId) {
      // Background profile update
      upsertUserProfile(userId).catch(() => {});
      
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      
      // Construct the final redirect URL
      let finalUrl: string;
      if (isLocalEnv) {
        finalUrl = `${origin}${next}?auth=success`;
      } else if (forwardedHost) {
        finalUrl = `https://${forwardedHost}${next}?auth=success`;
      } else {
        finalUrl = `${origin}${next}?auth=success`;
      }

      return NextResponse.redirect(finalUrl);
    }
    
    if (error) {
      console.error("[Auth Callback] Auth Error:", error.message);
      return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(error.message)}`);
    }
  }

  // Fallback
  return NextResponse.redirect(`${origin}/?error=no_session_created`);
}
