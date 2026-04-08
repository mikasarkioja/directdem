import { NextRequest, NextResponse } from "next/server";
import { runCitizenPulseCacheRefresh } from "@/lib/feed/run-citizen-pulse-cache-refresh";

export const maxDuration = 120;

/**
 * Päivän pulssi → cached_summaries (tunnitason tai käsin).
 * Authorization: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: NextRequest) {
  const startedAt = new Date().toISOString();
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, error: "Unauthorized", startedAt },
      { status: 401 },
    );
  }

  try {
    const result = await runCitizenPulseCacheRefresh();
    return NextResponse.json({
      success: result.ok,
      startedAt,
      finishedAt: new Date().toISOString(),
      ...result,
    });
  } catch (e) {
    console.error("[CronCitizenPulse]", e);
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "unknown",
        startedAt,
        finishedAt: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
