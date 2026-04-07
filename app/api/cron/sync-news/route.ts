import { NextRequest, NextResponse } from "next/server";
import { runMediaWatchNewsSync } from "@/lib/media-watch/sync-news-run";

export const maxDuration = 300;

const logger = {
  info: (...args: unknown[]) => console.log("[CronSyncNews]", ...args),
  warn: (...args: unknown[]) => console.warn("[CronSyncNews]", ...args),
  error: (...args: unknown[]) => console.error("[CronSyncNews]", ...args),
};

/**
 * Media Watch -uutissync (RSS, embeddingit, vektoriosumat, Gemini).
 * Authorization: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: NextRequest) {
  const startedAt = new Date().toISOString();
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    logger.warn("Unauthorized request.");
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized",
        startedAt,
        finishedAt: new Date().toISOString(),
      },
      { status: 401 },
    );
  }

  try {
    const result = await runMediaWatchNewsSync({
      maxPerFeed: 35,
      corpusBackfillPerTable: 40,
      similarityThreshold: 0.85,
    });

    const finishedAt = new Date().toISOString();

    if (!result.ok) {
      logger.error("Sync failed:", result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error ?? "Unknown error",
          startedAt,
          finishedAt,
        },
        { status: 500 },
      );
    }

    logger.info("Sync OK:", {
      insertedArticles: result.insertedArticles,
      newMatches: result.newMatches,
      embeddingBackfill: result.embeddingBackfill,
    });

    return NextResponse.json({
      success: true,
      startedAt,
      finishedAt,
      insertedArticles: result.insertedArticles,
      newMatches: result.newMatches,
      embeddingBackfill: result.embeddingBackfill,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    logger.error("Unhandled:", e);
    return NextResponse.json(
      {
        success: false,
        error: message,
        startedAt,
        finishedAt: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
