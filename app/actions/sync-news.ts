"use server";

import { checkAdminAccess } from "@/app/actions/admin";

import {
  runMediaWatchNewsSync,
  type SyncNewsResult,
} from "@/lib/media-watch/sync-news-run";

export type { SyncNewsResult };

/**

 * Hakee suomalaiset RSS-feedit, tallentaa uudet rivit news_articles + embedding,

 * täyttää osan päätöskorpus-embeddingeistä ja ajaa semanttisen matchingin (≥0.85) + Geminin.

 * Vaatii ylläpitäjän istunnon. Taustalla sama logiikka kuin GET /api/cron/sync-news.

 */

export async function syncNews(): Promise<SyncNewsResult> {
  const allowed = await checkAdminAccess();

  if (!allowed) {
    return {
      ok: false,

      error: "Media Watch -sykronointi vaatii ylläpitäjän oikeudet.",

      insertedArticles: 0,

      embeddingBackfill: { bills: 0, decisions: 0, municipal: 0 },

      newMatches: 0,
    };
  }

  return runMediaWatchNewsSync({
    maxPerFeed: 30,

    corpusBackfillPerTable: 35,

    similarityThreshold: 0.85,
  });
}
