import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Log for Vercel logs to see if this is even called
            if (name.includes('auth-token')) {
              console.log(`[Supabase Server] Setting auth cookie: ${name}`);
            }
            
            cookieStore.set(name, value, { 
              ...options, 
              path: options?.path || '/',
              secure: true,
              sameSite: options?.sameSite || 'lax'
            });
          });
        } catch (error) {
          // This is expected when called from Server Components during render
        }
      },
    },
  });
}
