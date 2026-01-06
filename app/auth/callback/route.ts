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
            // FORCE HIGHEST PERSISTENCE
            const cookieOptions = { 
              ...options, 
              path: '/', 
              sameSite: 'lax' as const,
              secure: true,
              httpOnly: name.includes('refresh-token'), // Security best practice
              maxAge: 60 * 60 * 24 * 365 // 1 year session if browser allows
            };
            
            cookieStore.set(name, value, cookieOptions);
            response.cookies.set(name, value, cookieOptions);
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
        
        // Final verification: we MUST return the 'response' object that 
        // contains the cookies from setAll!
        const successUrl = new URL(next, origin);
        successUrl.searchParams.set('auth', 'success');
        
        // Copy cookies to a fresh redirect to ensure they are the very last thing set
        const finalResponse = NextResponse.redirect(successUrl);
        response.cookies.getAll().forEach(c => {
          finalResponse.cookies.set(c.name, c.value, {
            path: '/', sameSite: 'lax', secure: true, maxAge: 60*60*24*7
          });
        });
        
        return finalResponse;
      }
    } else if (token_hash) {
      const { data, error } = await supabase.auth.verifyOtp({ token_hash, type: type as any });
      if (error) throw error;
      if (data.session) {
        upsertUserProfile(data.session.user.id).catch(() => {});
        const successUrl = new URL(next, origin);
        successUrl.searchParams.set('auth', 'success');
        const finalResponse = NextResponse.redirect(successUrl);
        response.cookies.getAll().forEach(c => {
          finalResponse.cookies.set(c.name, c.value, {
            path: '/', sameSite: 'lax', secure: true, maxAge: 60*60*24*7
          });
        });
        return finalResponse;
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
