/**
 * Upsert bulletin feed tables from bills, lobbyist_interventions, municipal_cases.
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local
 * Prerequisite SQL: supabase/bulletin-feed-sync-support.sql (unique indexes + columns)
 *
 * Usage: npx tsx scripts/sync-bulletin-feed.ts
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { syncBulletinFeedTables } from "../lib/bulletin/sync-feed-from-sources";
import { recordSyncSuccess } from "@/lib/ops/sync-logs";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
    );
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const result = await syncBulletinFeedTables(supabase);
  console.log(JSON.stringify(result, null, 2));
  if (!result.errors.length) {
    await recordSyncSuccess(supabase, "sync-bulletin-feed");
  }
  if (result.errors.length) {
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
