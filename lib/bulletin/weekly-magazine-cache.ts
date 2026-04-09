import { createAdminClient } from "@/lib/supabase/server";

/** Bumped when email template / bulletin JSON shape changes so stale HTML is not reused. */
export const WEEKLY_MAGAZINE_CACHE_KEY = "weekly_editorial_magazine_v5";

export type WeeklyMagazineCachePayload = {
  html: string;
  issueDate: string;
  /** UTC Monday 00:00 of week when this edition was computed (ISO string) */
  weekStartedAt: string;
};

/**
 * Newsletter cache is valid for the current UTC week (Mon 00:00–Sun).
 * Same HTML is reused for batch send and retries without a second Gemini call.
 */
export function startOfUtcWeekMonday(d: Date): Date {
  const x = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
  const dow = x.getUTCDay();
  const daysFromMonday = dow === 0 ? 6 : dow - 1;
  x.setUTCDate(x.getUTCDate() - daysFromMonday);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function isCacheValidThisUtcWeek(
  generatedAt: string,
  weekStartedAt: string | undefined,
): boolean {
  const weekStart = startOfUtcWeekMonday(new Date());
  const gen = new Date(generatedAt).getTime();
  if (!Number.isFinite(gen)) return false;
  if (gen < weekStart.getTime()) return false;
  if (weekStartedAt) {
    try {
      const stored = new Date(weekStartedAt).getTime();
      return stored === weekStart.getTime();
    } catch {
      return true;
    }
  }
  return true;
}

export async function getWeeklyMagazineEmailFromCache(): Promise<{
  html: string;
  issueDate: string;
} | null> {
  const admin = await createAdminClient();
  const { data, error } = await admin
    .from("cached_summaries")
    .select("payload, generated_at")
    .eq("cache_key", WEEKLY_MAGAZINE_CACHE_KEY)
    .maybeSingle();

  if (error || !data?.payload) return null;

  const p = data.payload as Partial<WeeklyMagazineCachePayload>;
  if (typeof p.html !== "string" || !p.html.length) return null;
  if (!isCacheValidThisUtcWeek(data.generated_at as string, p.weekStartedAt)) {
    return null;
  }

  return {
    html: p.html,
    issueDate: typeof p.issueDate === "string" ? p.issueDate : "",
  };
}

export async function saveWeeklyMagazineEmailCache(
  html: string,
  issueDate: string,
): Promise<void> {
  const admin = await createAdminClient();
  const weekStartedAt = startOfUtcWeekMonday(new Date()).toISOString();
  const { error } = await admin.from("cached_summaries").upsert(
    {
      cache_key: WEEKLY_MAGAZINE_CACHE_KEY,
      payload: {
        html,
        issueDate,
        weekStartedAt,
      } satisfies WeeklyMagazineCachePayload,
      generated_at: new Date().toISOString(),
    },
    { onConflict: "cache_key" },
  );
  if (error) {
    console.warn("[WeeklyMagazineCache] upsert failed:", error.message);
  }
}
