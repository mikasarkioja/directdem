/**
 * Täyttää public.legislative_projects Supabasen bills-riveistä (HE-tunnus).
 * Käyttää SERVICE_ROLE_KEY — ohittaa RLS.
 *
 * Aja: npx tsx scripts/sync-legislative-projects-from-bills.ts
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { syncLegislativeProjectsFromBills } from "@/lib/lobby/sync-legislative-projects-from-bills";
import { recordSyncSuccess } from "@/lib/ops/sync-logs";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    console.error(
      "Puuttuvat NEXT_PUBLIC_SUPABASE_URL tai SUPABASE_SERVICE_ROLE_KEY",
    );
    process.exit(1);
  }

  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const res = await syncLegislativeProjectsFromBills(admin);
  console.log(JSON.stringify(res, null, 2));

  if (res.error) {
    process.exit(1);
  }

  await recordSyncSuccess(admin, "sync-legislative-projects-from-bills");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
