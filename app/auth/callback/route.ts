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
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, { 
                ...options, 
                path: '/', 
                sameSite: 'lax', 
                secure: true 
              });
            });
          } catch (error) {
            // Server component context
          }
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
        const successUrl = new URL(next, origin);
        successUrl.searchParams.set('auth', 'success');
        return NextResponse.redirect(successUrl);
      }
    } else if (token_hash) {
      const { data, error } = await supabase.auth.verifyOtp({ token_hash, type: type as any });
      if (error) throw error;
      if (data.session) {
        await upsertUserProfile(data.session.user.id).catch(() => {});
        const successUrl = new URL(next, origin);
        successUrl.searchParams.set('auth', 'success');
        return NextResponse.redirect(successUrl);
      }
    }
    
    return NextResponse.redirect(new URL("/?error=auth_exchange_failed", origin));
  } catch (err: any) {
    console.error("[Auth Callback] Error:", err.message);
    const errorUrl = new URL("/", origin);
    errorUrl.searchParams.set('error', err.message);
    return NextResponse.redirect(errorUrl);
  }
}
