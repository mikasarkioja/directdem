import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // createBrowserClient osaa itse lukea document.cookie-arvot selaimessa.
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  );
}
