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

  // Use absolute URL for redirect to avoid relative path issues
  const origin = requestUrl.origin;
  const redirectTo = new URL(next, origin);
  
  const cookieStore = await cookies();
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
        await upsertUserProfile(data.session.user.id).catch(() => {});
        // Explicitly set the auth parameter on the absolute URL
        const finalUrl = new URL(next, origin);
        finalUrl.searchParams.set('auth', 'success');
        
        console.log("[Auth Callback] Success, redirecting to:", finalUrl.toString());
        
        return NextResponse.redirect(finalUrl, {
          headers: response.headers
        });
      }
    } else if (token_hash) {
      const { data, error } = await supabase.auth.verifyOtp({ token_hash, type: type as any });
      if (error) throw error;
      
      if (data.session) {
        await upsertUserProfile(data.session.user.id).catch(() => {});
        const finalUrl = new URL(next, origin);
        finalUrl.searchParams.set('auth', 'success');
        
        return NextResponse.redirect(finalUrl, {
          headers: response.headers
        });
      }
    }
    
    const errorUrl = new URL("/", origin);
    errorUrl.searchParams.set('error', 'no_session_created');
    return NextResponse.redirect(errorUrl);
  } catch (err: any) {
    console.error("[Auth Callback] Error:", err.message);
    const errorUrl = new URL("/", origin);
    errorUrl.searchParams.set('error', err.message);
    return NextResponse.redirect(errorUrl);
  }
}
