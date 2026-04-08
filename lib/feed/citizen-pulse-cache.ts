import { createClient } from "@/lib/supabase/server";

/** Yksi rivi / ympäristö; cron päivittää `payload`-kentän. */
export const CITIZEN_PULSE_CACHE_KEY = "citizen_pulse_fi";

export type CachedCitizenPulseRow = {
  summary: string;
  model: string;
  feedItemCount?: number;
  generatedAt: string;
};

/**
 * Lukee esilasketun Päivän pulssi -yhteenvedon (ei Geminiä käyttäjäpolulla).
 */
export async function getCachedCitizenPulseSummary(): Promise<CachedCitizenPulseRow | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("cached_summaries")
      .select("payload, generated_at")
      .eq("cache_key", CITIZEN_PULSE_CACHE_KEY)
      .maybeSingle();

    if (error || !data?.payload) return null;

    const p = data.payload as Record<string, unknown>;
    const summary = typeof p.summary === "string" ? p.summary : "";
    if (!summary.trim()) return null;

    return {
      summary: summary.trim(),
      model: typeof p.model === "string" ? p.model : "",
      feedItemCount:
        typeof p.feedItemCount === "number" ? p.feedItemCount : undefined,
      generatedAt: data.generated_at as string,
    };
  } catch {
    return null;
  }
}
