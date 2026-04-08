/**
 * Media Watch: RSS → news_articles + embeddings + corpus matches.
 * Same logic as GET /api/cron/sync-news and admin action syncNews().
 *
 * Requires .env.local: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
 * SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY (for embeddings/matching as used by pipeline).
 *
 * Usage: npm run sync-news
 */

import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main(): Promise<void> {
  const { runMediaWatchNewsSync } =
    await import("../lib/media-watch/sync-news-run");
  const result = await runMediaWatchNewsSync();
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("[sync-news]", e);
  process.exit(1);
});
