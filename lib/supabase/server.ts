import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Force attributes that are known to work better with Firefox session persistence
            const finalOptions = {
              ...options,
              path: '/',
              sameSite: 'lax' as const,
              // In production, always use secure cookies
              secure: process.env.NODE_ENV === 'production' ? true : options?.secure,
            };
            cookieStore.set(name, value, finalOptions);
          });
        } catch (error) {
          // This is expected when called from Server Components
        }
      },
    },
  });
}
