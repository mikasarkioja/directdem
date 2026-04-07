/**
 * Apply supabase/lobbyist-interventions-schema.sql to Supabase Postgres (DDL).
 *
 * Requires in .env.local:
 *   DATABASE_URL  — Supabase → Project Settings → Database → URI (use "Direct" or pooler;
 *                   must be postgres://... with password, not the anon key)
 *
 * If DATABASE_URL is missing, open the SQL file in the Supabase SQL Editor and run it.
 *
 * Usage: npx tsx scripts/apply-lobbyist-schema.ts
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const url =
  process.env.DATABASE_URL?.trim() || process.env.SUPABASE_DATABASE_URL?.trim();

async function main(): Promise<void> {
  if (!url) {
    console.error(
      "[apply-lobbyist-schema] Set DATABASE_URL (or SUPABASE_DATABASE_URL) in .env.local.\n" +
        "Find it in Supabase Dashboard → Project Settings → Database → Connection string → URI.\n" +
        "Alternatively, paste and run: supabase/lobbyist-interventions-schema.sql in the SQL Editor.",
    );
    process.exit(1);
  }

  const file = path.resolve(
    process.cwd(),
    "supabase/lobbyist-interventions-schema.sql",
  );
  const ddl = readFileSync(file, "utf8");

  console.log("[apply-lobbyist-schema] Executing", file);

  const sql = postgres(url, {
    ssl: url.includes("localhost") ? false : "require",
    max: 1,
    connect_timeout: 30,
  });

  try {
    await sql.unsafe(ddl);
    console.log(
      "[apply-lobbyist-schema] OK — legislative_projects + lobbyist_interventions ready.",
    );
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((e) => {
  console.error("[apply-lobbyist-schema] Failed:", e);
  process.exit(1);
});
