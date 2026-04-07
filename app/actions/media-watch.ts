"use server";

import { createClient } from "@/lib/supabase/server";
import type { MediaWatchAiSummary } from "@/lib/media-watch/gemini-analysis";

export type MediaWatchFeedRow = {
  match_id: string;
  similarity_score: number;
  ai_analysis_summary: MediaWatchAiSummary | Record<string, unknown> | null;
  /** Grounding-lähteet (Google Search) ja viitteet */
  ai_analysis_json?: Record<string, unknown> | null;
  matched_at: string | null;
  news_id: string;
  news_title: string;
  news_content: string | null;
  news_url: string;
  news_source_name: string | null;
  news_published_at: string | null;
  decision_id: string | null;
  bill_id: string | null;
  municipal_decision_id: string | null;
  decision_title: string | null;
  decision_summary: string | null;
  decision_external_ref: string | null;
  bill_title: string | null;
  bill_summary: string | null;
  bill_parliament_id: string | null;
  municipal_title: string | null;
  municipal_summary: string | null;
  municipal_municipality: string | null;
  municipal_url: string | null;
};

export async function fetchMediaWatchFeed(
  limit = 40,
): Promise<MediaWatchFeedRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("media_watch_feed")
    .select("*")
    .order("matched_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    console.error("[fetchMediaWatchFeed]", error);
    return [];
  }

  return (data || []) as MediaWatchFeedRow[];
}

/**
 * Media Watch -osumat, jotka on linkitetty tähän lakiesitykseen (bill-UUID tai HE-tunnus).
 */
export async function fetchMediaWatchMatchesForBill(
  billId: string,
  options?: { parliamentId?: string | null; limit?: number },
): Promise<MediaWatchFeedRow[]> {
  const supabase = await createClient();
  const limit = options?.limit ?? 10;
  const parliamentId = options?.parliamentId?.trim() || null;

  const { data: byBill, error: errBill } = await supabase
    .from("media_watch_feed")
    .select("*")
    .eq("bill_id", billId)
    .order("matched_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (errBill) {
    console.error("[fetchMediaWatchMatchesForBill] bill_id", errBill);
  }
  if (byBill && byBill.length > 0) {
    return byBill as MediaWatchFeedRow[];
  }

  if (parliamentId) {
    const { data: byRef, error: errRef } = await supabase
      .from("media_watch_feed")
      .select("*")
      .eq("bill_parliament_id", parliamentId)
      .order("matched_at", { ascending: false, nullsFirst: false })
      .limit(limit);

    if (errRef) {
      console.error("[fetchMediaWatchMatchesForBill] parliament_id", errRef);
    }
    return (byRef || []) as MediaWatchFeedRow[];
  }

  return [];
}
