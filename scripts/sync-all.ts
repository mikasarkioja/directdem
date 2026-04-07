/**
 * Master data sync: Eduskunta bills + votes, Espoo RSS → municipal_cases,
 * bulletin denormalized tables (decisions, lobbyist_traces, municipal_decisions).
 *
 * Env: .env.local → NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   npx tsx scripts/sync-all.ts              # fast (no full municipal scrape)
 *   npx tsx scripts/sync-all.ts --full       # + daily-municipal-sync (slow, OpenAI)
 */

import { execSync } from "node:child_process";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

function runScript(relScript: string, args: string[] = []): void {
  const scriptPath = path.resolve(process.cwd(), relScript);
  const cmd = ["npx", "tsx", scriptPath, ...args].join(" ");
  execSync(cmd, { stdio: "inherit", cwd: process.cwd(), env: process.env });
}

async function main(): Promise<void> {
  const full = process.argv.includes("--full");

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  ) {
    console.error(
      "[sync-all] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
    );
    process.exit(1);
  }

  console.log("[sync-all] Starting (full municipal scrape:", full, ")");

  console.log("\n[sync-all] Step 1/4: Eduskunta bills + Espoo RSS → Supabase");
  runScript("scripts/sync-latest-bills-eduskunta-espoo.ts", ["--espoo-all"]);

  console.log(
    "\n[sync-all] Step 2/4: Bulletin feed tables (from bills / interventions / cases)",
  );
  runScript("scripts/sync-bulletin-feed.ts");

  console.log("\n[sync-all] Step 3/4: Eduskunta mp_votes + active MPs marker");
  runScript("scripts/fetch-eduskunta-data.ts");

  if (full) {
    console.log(
      "\n[sync-all] Step 4/4: Municipal Dynasty + Ahjo + Vantaa (slow, may call OpenAI)…",
    );
    runScript("scripts/daily-municipal-sync.ts");
  } else {
    console.log(
      "\n[sync-all] Step 4/4: Skipped daily-municipal-sync.ts (pass --full to run)",
    );
  }

  console.log("\n[sync-all] Finished.");
}

main().catch((e) => {
  console.error("[sync-all] Fatal:", e);
  process.exit(1);
});
