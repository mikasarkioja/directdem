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
  const redirectTo = new URL(next, origin);
  
  // Create a base response
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
            // Set for server-side
            cookieStore.set(name, value, { ...options, path: '/', sameSite: 'lax', secure: true });
            // Set for browser-side
            response.cookies.set(name, value, { ...options, path: '/', sameSite: 'lax', secure: true });
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
        
        // Add success flag to the final redirect
        const finalUrl = new URL(next, origin);
        finalUrl.searchParams.set('auth', 'success');
        
        // Create a final response and copy ALL cookies gathered during the exchange
        const finalResponse = NextResponse.redirect(finalUrl);
        response.cookies.getAll().forEach(cookie => {
          finalResponse.cookies.set(cookie.name, cookie.value, {
            path: '/',
            sameSite: 'lax',
            secure: true,
            maxAge: 60 * 60 * 24 * 7 // 1 week
          });
        });
        
        return finalResponse;
      }
    } else if (token_hash) {
      const { data, error } = await supabase.auth.verifyOtp({ token_hash, type: type as any });
      if (error) throw error;
      
      if (data.session) {
        await upsertUserProfile(data.session.user.id).catch(() => {});
        const finalUrl = new URL(next, origin);
        finalUrl.searchParams.set('auth', 'success');
        
        const finalResponse = NextResponse.redirect(finalUrl);
        response.cookies.getAll().forEach(cookie => {
          finalResponse.cookies.set(cookie.name, cookie.value, {
            path: '/',
            sameSite: 'lax',
            secure: true,
            maxAge: 60 * 60 * 24 * 7
          });
        });
        
        return finalResponse;
      }
    }
    
    return NextResponse.redirect(new URL("/?error=auth_failed", origin));
  } catch (err: any) {
    console.error("[Auth Callback] Error:", err.message);
    const errorUrl = new URL("/", origin);
    errorUrl.searchParams.set('error', err.message);
    return NextResponse.redirect(errorUrl);
  }
}
