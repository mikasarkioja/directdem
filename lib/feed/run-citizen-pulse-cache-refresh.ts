import { createAdminClient } from "@/lib/supabase/server";
import { getIntelligenceFeed } from "@/lib/feed/feed-service";
import { generateCitizenPulseTodaySummary } from "@/lib/feed/citizen-pulse-gemini";
import { CITIZEN_PULSE_CACHE_KEY } from "@/lib/feed/citizen-pulse-cache";

/**
 * Cron / batch: laskee pulssin ja tallenna cached_summaries-tauluun.
 */
export async function runCitizenPulseCacheRefresh(): Promise<{
  ok: boolean;
  error?: string;
  itemCount?: number;
}> {
  const items = await getIntelligenceFeed(null);
  const pulse = await generateCitizenPulseTodaySummary(items);

  if (!pulse?.summary?.trim()) {
    return {
      ok: false,
      error:
        items.length === 0
          ? "empty_feed"
          : "gemini_unavailable_or_empty_response",
      itemCount: items.length,
    };
  }

  const admin = await createAdminClient();
  const { error } = await admin.from("cached_summaries").upsert(
    {
      cache_key: CITIZEN_PULSE_CACHE_KEY,
      payload: {
        summary: pulse.summary,
        model: pulse.model,
        feedItemCount: items.length,
      },
      generated_at: new Date().toISOString(),
    },
    { onConflict: "cache_key" },
  );

  if (error) {
    console.error("[runCitizenPulseCacheRefresh]", error.message);
    return { ok: false, error: error.message, itemCount: items.length };
  }

  return { ok: true, itemCount: items.length };
}
