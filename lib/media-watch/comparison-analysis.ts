import { z } from "zod";

const discrepancyItemSchema = z.object({
  kind: z.enum(["error", "fact"]),
  text: z.string(),
});

export const mediaWatchComparisonSchema = z.object({
  accuracyScore: z.number().min(0).max(100),
  discrepancies: z.array(discrepancyItemSchema).default([]),
  framing: z.string(),
  selkokieliSummary: z.string(),
  badge: z.enum(["fact_check", "context"]).optional(),
});

export type MediaWatchComparisonAnalysis = z.infer<
  typeof mediaWatchComparisonSchema
>;

export type LegacyMediaWatchAiSummary = {
  accuracyScore: number;
  keyDiscrepancy: string;
  politicalContext: string;
  badge: "fact_check" | "context";
};

/** Yhdistää uuden vertailu-JSONin ja vanhan MediaWatchAiSummary-muodon näytölle. */
export function normalizeMediaWatchAnalysis(
  raw: unknown,
): MediaWatchComparisonAnalysis | null {
  if (!raw || typeof raw !== "object") return null;
  const o0 = raw as Record<string, unknown>;
  if (typeof o0.accuracy === "number" && typeof o0.accuracyScore !== "number") {
    return normalizeMediaWatchAnalysis({
      ...o0,
      accuracyScore: o0.accuracy,
    });
  }
  const parsed = mediaWatchComparisonSchema.safeParse(raw);
  if (parsed.success) return parsed.data;

  const o = raw as Record<string, unknown>;
  if (typeof o.accuracyScore !== "number") return null;

  const legacy = o as unknown as LegacyMediaWatchAiSummary;
  const discrepancies: MediaWatchComparisonAnalysis["discrepancies"] = [];
  if (legacy.keyDiscrepancy?.trim()) {
    discrepancies.push({ kind: "error", text: legacy.keyDiscrepancy.trim() });
  }
  if (legacy.politicalContext?.trim()) {
    discrepancies.push({ kind: "fact", text: legacy.politicalContext.trim() });
  }

  return {
    accuracyScore: legacy.accuracyScore,
    discrepancies,
    framing: legacy.politicalContext?.trim()
      ? `Poliittinen kehys: ${legacy.politicalContext}`
      : "Kehystystä ei kuvattu.",
    selkokieliSummary:
      (typeof o.selkokieliSummary === "string" && o.selkokieliSummary) ||
      legacy.keyDiscrepancy ||
      "Tiivistelmää ei saatavilla.",
    badge: legacy.badge,
  };
}
