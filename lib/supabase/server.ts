import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  // PUHDISTUS: Poistetaan kaikki mahdolliset näkymättömät merkit
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/[\r\n]/g, '');
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim().replace(/[\r\n]/g, '');

  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component ignore
          }
        },
      },
    }
  );
}
