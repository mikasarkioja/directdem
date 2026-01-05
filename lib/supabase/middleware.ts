import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

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
            // Päivitä evästeet pyyntöön (request) middlewarelle
            request.cookies.set(name, value);
            // Päivitä evästeet vastaukseen (response) selaimelle
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Tämä on kriittinen: getUser() päivittää evästeet vastaukseen, jos ne ovat muuttuneet
  await supabase.auth.getUser();

  return supabaseResponse;
}

