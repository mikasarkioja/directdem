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
  
  // 1. Create the final destination URL
  const redirectTo = new URL(next, origin);
  
  // 2. Create the response object
  const response = NextResponse.redirect(redirectTo);

  // 3. Create Supabase client with a dual-set strategy
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
            // Force safe defaults for all cookies
            const cookieOptions = { 
              ...options, 
              path: '/', 
              sameSite: 'lax' as const,
              secure: true // Vercel is always HTTPS
            };
            
            // Set on cookie store (for server-side immediate use)
            cookieStore.set(name, value, cookieOptions);
            // Set on response (for browser-side persistence)
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
        await upsertUserProfile(data.session.user.id).catch(() => {});
        
        // Add success flag
        const successUrl = new URL(next, origin);
        successUrl.searchParams.set('auth', 'success');
        
        // IMPORTANT: We must return the 'response' object we created 
        // because it contains the cookies set during exchangeCodeForSession
        const finalResponse = NextResponse.redirect(successUrl);
        
        // Copy cookies from our working response to the final redirect response
        response.cookies.getAll().forEach(cookie => {
          finalResponse.cookies.set(cookie.name, cookie.value, {
            path: '/',
            sameSite: 'lax',
            secure: true,
            httpOnly: cookie.name.includes('refresh-token') // Only refresh token needs to be httpOnly
          });
        });

        return finalResponse;
      }
    } else if (token_hash) {
      const { data, error } = await supabase.auth.verifyOtp({ token_hash, type: type as any });
      if (error) throw error;
      if (data.session) {
        await upsertUserProfile(data.session.user.id).catch(() => {});
        const successUrl = new URL(next, origin);
        successUrl.searchParams.set('auth', 'success');
        const finalResponse = NextResponse.redirect(successUrl);
        response.cookies.getAll().forEach(cookie => {
          finalResponse.cookies.set(cookie.name, cookie.value, { path: '/', sameSite: 'lax', secure: true });
        });
        return finalResponse;
      }
    }
    
    return NextResponse.redirect(new URL("/?error=no_session", origin));
  } catch (err: any) {
    console.error("[Auth Callback] Fatal Error:", err.message);
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(err.message)}`, origin));
  }
}
