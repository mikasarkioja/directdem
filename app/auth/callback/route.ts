import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { upsertUserProfile } from "@/app/actions/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";
  const origin = requestUrl.origin;

  // 1. Create the response object FIRST. This is our "carrier" for cookies.
  const response = NextResponse.redirect(new URL(`${next}?auth=success`, origin));

  if (code) {
    const cookieStore = await cookies();
    
    // 2. Create the Supabase client and bind it to BOTH the cookieStore AND our response object.
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
              // Set on the server-side store
              try {
                cookieStore.set(name, value, { ...options, path: '/', sameSite: 'lax', secure: true });
              } catch (e) {}
              
              // Set on the response object that goes to the browser (CRITICAL)
              response.cookies.set(name, value, { 
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

    // 3. Perform the exchange. This will trigger setAll() above.
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error("[Auth Callback] Exchange error:", error.message);
      return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error.message)}`, origin));
    }

    if (data.session) {
      // Background profile update - don't block the response
      upsertUserProfile(data.session.user.id).catch(() => {});
      
      // 4. Return the specific response object we created!
      return response;
    }
  }

  return NextResponse.redirect(new URL("/?error=no_session", origin));
}
