import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // PUHDISTUS: Varmistetaan että avaimet ovat puhtaita
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

  // 1. Luodaan alustava vastaus
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        // Päivitetään pyynnön evästeet, jotta Server Componentit näkevät ne heti
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        
        // Luodaan uusi vastaus päivitetyillä pyynnön evästeillä
        supabaseResponse = NextResponse.next({
          request,
        });

        // Päivitetään vastauksen evästeet, jotta selain tallentaa ne
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
    // Pakotetaan SameSite: Lax Firefox-ongelmien välttämiseksi
    cookieOptions: {
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
    }
  });

  // TÄRKEÄÄ: Tämä tarkistus kutsuu setAll-funktiota, jos token on vanhentunut
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
  
  // Jos olet suojatulla polulla ja user on null (eikä ole ghost), ohjaa kirjautumiseen
  if (isProtectedPath && !user && !isGhost) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
