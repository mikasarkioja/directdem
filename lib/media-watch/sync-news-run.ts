import { createAdminClient } from "@/lib/supabase/server";
import { fetchAllMediaRssItems } from "@/lib/media-watch/feeds";
import { embedFinnishNewsText } from "@/lib/media-watch/embeddings";
import {
  backfillDecisionCorpusEmbeddings,
  matchNewsArticleToCorpus,
} from "@/lib/media-watch/pipeline";

export type SyncNewsResult = {
  ok: boolean;
  error?: string;
  insertedArticles: number;
  embeddingBackfill: { bills: number; decisions: number; municipal: number };
  newMatches: number;
};

/**
 * Media Watch: RSS → news_articles + embedding → vektorihaku → match-rivit (+ Gemini).
 * Ei tarkista käyttäjää — kutsu vain cronista (CRON_SECRET) tai admin-actionista.
 */
export async function runMediaWatchNewsSync(options?: {
  maxPerFeed?: number;
  corpusBackfillPerTable?: number;
  similarityThreshold?: number;
}): Promise<SyncNewsResult> {
  const maxPerFeed = options?.maxPerFeed ?? 30;
  const corpusBackfill = options?.corpusBackfillPerTable ?? 35;
  const similarityThreshold = options?.similarityThreshold ?? 0.85;

  try {
    const admin = await createAdminClient();
    const embeddingBackfill = await backfillDecisionCorpusEmbeddings(admin, {
      maxPerTable: corpusBackfill,
    });

    const items = await fetchAllMediaRssItems(maxPerFeed);
    let insertedArticles = 0;
    let newMatches = 0;

    for (const item of items) {
      const { data: existing } = await admin
        .from("news_articles")
        .select("id")
        .eq("source_url", item.link)
        .maybeSingle();

      if (existing?.id) continue;

      let embedding: number[] | null = null;
      try {
        const blob = `${item.title}\n\n${item.contentSnippet}`.slice(0, 8000);
        embedding = await embedFinnishNewsText(blob);
      } catch (e) {
        console.warn(
          "[runMediaWatchNewsSync] embedding failed for",
          item.link,
          e,
        );
        continue;
      }

      const publishedAt = (() => {
        const t = Date.parse(item.pubDate);
        return Number.isFinite(t) ? new Date(t).toISOString() : null;
      })();

      const { data: row, error: insErr } = await admin
        .from("news_articles")
        .insert({
          title: item.title,
          content: item.contentSnippet || null,
          source_url: item.link,
          published_at: publishedAt,
          embedding,
          source_name: item.sourceName,
        })
        .select("id")
        .single();

      if (insErr || !row?.id) {
        console.warn("[runMediaWatchNewsSync] insert news:", insErr);
        continue;
      }

      insertedArticles++;

      const n = await matchNewsArticleToCorpus(admin, {
        newsId: row.id,
        newsTitle: item.title,
        newsSummary: item.contentSnippet || "",
        embedding,
        similarityThreshold,
      });
      newMatches += n;
    }

    return {
      ok: true,
      insertedArticles,
      embeddingBackfill,
      newMatches,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[runMediaWatchNewsSync]", e);
    return {
      ok: false,
      error: msg,
      insertedArticles: 0,
      embeddingBackfill: { bills: 0, decisions: 0, municipal: 0 },
      newMatches: 0,
    };
  }
}
