import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // PUHDISTUS: Varmistetaan että avaimet ovat puhtaita
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Tarkistetaan käyttäjä
  const { data: { user } } = await supabase.auth.getUser();

  // TARKISTETAAN GHOST-KÄYTTÄJÄ
  const guestId = request.cookies.get("guest_user_id")?.value;
  const isGhost = !!guestId;

  const path = request.nextUrl.pathname;

  // LOGI: Nyt näemme vihdoin FOUND tai GHOST jos kaikki on kunnossa
  if (!path.includes('.') && !path.startsWith('/_next')) {
    console.log(`[Middleware] ${path} | User: ${user ? 'FOUND' : (isGhost ? 'GHOST' : 'NOT FOUND')}`);
  }

  const isProtectedPath = path.startsWith("/dashboard") || path.startsWith("/testi/tulokset");
  const isAdminPath = path.startsWith("/admin");

  // TEMPORARY: Allow all users to access /admin for testing
  /*
  if (isAdminPath) {
    if (!user || (user.email !== 'nika.sarkioja@gmail.com' && !user.email?.includes('admin'))) {
      const homeUrl = new URL("/", request.url);
      return NextResponse.redirect(homeUrl);
    }
  }
  */

  if (isProtectedPath && !user && !isGhost) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}
