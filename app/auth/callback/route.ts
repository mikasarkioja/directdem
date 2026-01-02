import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") || "magiclink";
  const next = requestUrl.searchParams.get("next") ?? "/";

  // Create response object first
  const response = NextResponse.redirect(new URL(next, requestUrl.origin));
  
  if (token_hash) {
    const supabase = await createClient();

    // Verify OTP
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    });

    if (!error && data.session) {
      console.log("[Auth Callback] verifyOtp SUCCESS. Session created.");
      
      const cookieStore = await cookies();
      const projectId = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('.')[0].split('//')[1];
      const cookieName = `sb-${projectId}-auth-token`;
      
      const authCookie = cookieStore.get(cookieName);
      if (authCookie) {
        response.cookies.set(authCookie.name, authCookie.value, {
          path: '/',
          secure: requestUrl.hostname !== 'localhost',
          sameSite: 'lax',
          httpOnly: true
        });
      }

      return response;
    }

    if (error) {
      console.error("[Auth Callback] verifyOtp error:", error.message);
    }
  }

  // Redirect to home instead of /kirjaudu even on error
  return NextResponse.redirect(new URL("/", requestUrl.origin));
}
