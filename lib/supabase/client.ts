import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // createBrowserClient osaa itse lukea document.cookie-arvot selaimessa.
  // Emme lisää tähän ylimääräisiä optioita, jotka saattavat sekoittaa SSR:ää.
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
