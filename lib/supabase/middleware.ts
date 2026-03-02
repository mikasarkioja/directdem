import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

export async function updateSession(request: NextRequest) {
  // 1. Luodaan alustava vastaus
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL || "",
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Päivitetään pyynnön evästeet, jotta Server Componentit näkevät ne heti
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );

          // Luodaan uusi vastaus päivitetyillä pyynnön evästeillä, mutta säästetään aiemmat evästeet
          const oldCookies = supabaseResponse.cookies.getAll();
          supabaseResponse = NextResponse.next({
            request,
          });

          // Palautetaan aiemmat evästeet uuteen vastaukseen
          oldCookies.forEach((c) =>
            supabaseResponse.cookies.set(c.name, c.value, c.options),
          );

          // Päivitetään vastauksen evästeet uusilla arvoilla
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
      // Pakotetaan SameSite: Lax Firefox-ongelmien välttämiseksi
      cookieOptions: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  );

  // TÄRKEÄÄ: Tämä tarkistus kutsuu setAll-funktiota, jos token on vanhentunut
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // TARKISTETAAN GHOST-KÄYTTÄJÄ
  const guestId = request.cookies.get("guest_user_id")?.value;
  const isGhost = !!guestId;

  const path = request.nextUrl.pathname;

  // Jos olemme jo kirjautuneita, emme tarvitse login-sivua
  if (user && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie.options);
    });
    return redirectResponse;
  }

  // Dashboard on nyt avoin kaikille (kansalaisnäkymä), vain tietyt polut vaativat kirjautumisen
  const isProtectedPath =
    path.startsWith("/profiili") ||
    path.startsWith("/admin") ||
    path.startsWith("/settings");

  // Jos olet suojatulla polulla ja user on null (eikä ole ghost), ohjaa kirjautumiseen
  if (isProtectedPath && !user && !isGhost) {
    console.log(
      `[Middleware] REDIRECT to /login from ${path} | User: NULL | Ghost: NO`,
    );
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Tärkeää: Jos redirectataan, täytyy mahdolliset uudistetun session evästeet siirtää redirect-vastaukseen
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie.options);
    });
    return redirectResponse;
  }

  return supabaseResponse;
}
