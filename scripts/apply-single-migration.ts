/**
 * One-off: apply a migration file using DATABASE_URL from .env.local
 * Usage: npx tsx scripts/apply-single-migration.ts supabase/migrations/FOO.sql
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main(): Promise<void> {
  const rel = process.argv[2];
  if (!rel) {
    console.error(
      "Usage: npx tsx scripts/apply-single-migration.ts <path-to.sql>",
    );
    process.exit(1);
  }
  const url =
    process.env.DATABASE_URL?.trim() ||
    process.env.SUPABASE_DATABASE_URL?.trim();
  if (!url) {
    console.error("Set DATABASE_URL or SUPABASE_DATABASE_URL in .env.local");
    process.exit(1);
  }
  const file = path.resolve(process.cwd(), rel);
  const ddl = readFileSync(file, "utf8");
  const sql = postgres(url, {
    ssl: url.includes("localhost") ? false : "require",
    max: 1,
    connect_timeout: 30,
  });
  try {
    await sql.unsafe(ddl);
    console.log("[apply-single-migration] OK:", file);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((e) => {
  console.error("[apply-single-migration] Failed:", e);
  process.exit(1);
});
