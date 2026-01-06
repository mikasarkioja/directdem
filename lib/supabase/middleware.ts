import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware to handle Supabase session refreshing and route protection.
 * Follows the official Next.js 15 + Supabase SSR pattern.
 */
export async function updateSession(request: NextRequest) {
  // 1. Create the initial response
  let supabaseResponse = NextResponse.next({
    request,
  });

  // 2. Initialize Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Update request cookies for the current execution
            request.cookies.set(name, value);
            // Update response cookies for the browser
            supabaseResponse.cookies.set(name, value, {
              ...options,
              path: options?.path || '/',
              sameSite: options?.sameSite || 'lax',
              secure: process.env.NODE_ENV === 'production',
            });
          });
        },
      },
    }
  );

  // 3. IMPORTANT: Refresh session if expired
  // This is required for the session to persist correctly
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 4. Route Protection Logic
  const url = new URL(request.url);
  const isProtectedPath = 
    url.pathname.startsWith("/dashboard") || 
    url.pathname.startsWith("/testi/tulokset") || // Result page requires profile
    url.pathname.startsWith("/profiili") ||
    (url.pathname === "/" && url.searchParams.get("view") === "workspace");

  const isAuthPath = url.pathname.startsWith("/login") || url.pathname.startsWith("/auth");

  // Redirect to login if accessing protected path without session
  if (isProtectedPath && !user) {
    const redirectUrl = new URL("/login", request.url);
    // Keep the intended destination in search params if needed
    if (url.pathname !== "/") {
        redirectUrl.searchParams.set("returnTo", url.pathname);
    }
    return NextResponse.redirect(redirectUrl);
  }

  // Optional: Redirect to dashboard if logged in user tries to access login page
  if (isAuthPath && user) {
    return NextResponse.redirect(new URL("/?view=workspace", request.url));
  }

  return supabaseResponse;
}
