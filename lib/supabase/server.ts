import { createServerClient } from "@supabase/ssr";

export async function createClient() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();

  // PUHDISTUS: Poistetaan kaikki mahdolliset näkymättömät merkit
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/[\r\n]/g, "");
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim().replace(/[\r\n]/g, "");

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Componenteissa ei voi asettaa evästeitä, 
          // mutta se on ok, koska Middleware hoitaa sen.
        }
      },
    },
  });
}

export async function createAdminClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/[\r\n]/g, "");
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim().replace(/[\r\n]/g, "");

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        // Admin client doesn't need to set cookies
      },
    },
  });
}
