/**
 * Kuntavahti list order:
 * 1) kaupunginvaltuusto (tier 0)
 * 2) muut elimet, ei lautakunta (tier 1)
 * 3) lautakunta / jaosto (tier 2) — painetaan alas; listaan myös kiintiö (maxLautakuntaSlots)
 * Tasoissa: talouspisteytys, sitten päivämäärä.
 */

const VALTUUSTO_RE =
  /(kaupungin|kunnan)?valtuusto|kaupunginhallituksen\s+esitys|esitys\w*\s+valtuustolle|^valtuusto\s*\d/i;

/** Lista enintään näin monta lautakunta-/jaostoriviä, vaikka niitä olisi järjestyksessä enemmän. */
export const KUNTAVAHTI_MAX_LAUTAKUNTA_SLOTS = 8;

const ECON_KEYWORD_RES: RegExp[] = [
  /€|\beur\b|\bmk\b/i,
  /\d[\d\s]*\s*(€|eur|milj|miljoona)/i,
  /\b(milj|miljoona|tonni|tuhatta)\b/i,
  /\b(kustannus|kustannukset|taloussuunnitelma|talousarvio|budjetti|menot)\b/i,
  /\b(investointi|rahoitus|laina|velka|maksut|palvelumaksu|asukasmaksu)\b/i,
  /\b(vero|kiinteistövero|tontti|vuokra|subventio|avustus|korotus)\b/i,
];

export function isCityCouncilMunicipalRow(row: {
  title?: string | null;
  proposer?: string | null;
  content_summary?: string | null;
  summary?: string | null;
  meeting_title?: string | null;
}): boolean {
  const blob = [
    row.title,
    row.proposer,
    row.content_summary,
    row.summary,
    row.meeting_title,
  ]
    .filter(Boolean)
    .join(" ");
  return VALTUUSTO_RE.test(blob);
}

/**
 * 0 = valtuusto, 1 = muu (ei lautakuntakomposiittia), 2 = lautakunta tai jaosto
 * Yhdisteet (esim. kaupunkisuunnittelulautakunta): osajono "lautakunta".
 */
export function kuntavahtiBodyTier(row: {
  title?: string | null;
  proposer?: string | null;
  content_summary?: string | null;
  summary?: string | null;
  meeting_title?: string | null;
}): number {
  if (isCityCouncilMunicipalRow(row)) return 0;
  const blob = [
    row.title,
    row.proposer,
    row.content_summary,
    row.summary,
    row.meeting_title,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (blob.includes("lautakunta") || /\bjaosto\b/.test(blob)) return 2;
  return 1;
}

/**
 * Ensin kaikki muut kuin lautakuntakiintiö (järjestys säilyy), sitten lautakuntarivejä
 * enintään maxLautakuntaSlots kpl kunnes `limit` täynnä.
 */
export function buildKuntavahtiOrderedSlice<T>(
  sorted: T[],
  limit: number,
  options?: { maxLautakuntaSlots?: number },
): T[] {
  const maxLa = options?.maxLautakuntaSlots ?? KUNTAVAHTI_MAX_LAUTAKUNTA_SLOTS;
  const primary: T[] = [];
  const committee: T[] = [];
  for (const row of sorted) {
    if (kuntavahtiBodyTier(row as any) === 2) committee.push(row);
    else primary.push(row);
  }
  const out: T[] = [];
  for (const row of primary) {
    if (out.length >= limit) break;
    out.push(row);
  }
  let addedLa = 0;
  for (const row of committee) {
    if (out.length >= limit) break;
    if (addedLa >= maxLa) break;
    out.push(row);
    addedLa++;
  }
  return out;
}

/** Heuristinen 0…∞; suurempi = vahvempi talouskytkentä */
export function municipalEconomicKeywordScore(text: string): number {
  if (!text?.trim()) return 0;
  const t = text.toLowerCase();
  let score = 0;
  for (const re of ECON_KEYWORD_RES) {
    if (re.test(t)) score += 14;
  }
  return score;
}

export function municipalRowFinancialScore(row: {
  cost_estimate?: unknown;
  impact_score?: unknown;
  title?: string | null;
  content_summary?: string | null;
  summary?: string | null;
}): number {
  let s = municipalEconomicKeywordScore(
    `${row.title || ""} ${row.content_summary || ""} ${row.summary || ""}`,
  );

  const cost = row.cost_estimate != null ? Number(row.cost_estimate) : NaN;
  if (Number.isFinite(cost) && cost > 0) {
    s += Math.min(120, 25 + Math.log10(cost + 1) * 18);
  }

  const impact = row.impact_score != null ? Number(row.impact_score) : NaN;
  if (Number.isFinite(impact) && impact > 0) {
    s += Math.min(90, impact);
  }

  return s;
}

export function meetingAnalysisFinancialScore(row: {
  meeting_title?: string | null;
  ai_summary?: {
    summary?: string;
    dna_impact?: Record<string, number>;
    friction_index?: number;
    deep_analysis?: { economic_impact?: { total_cost_estimate?: number } };
  } | null;
}): number {
  const ai = row.ai_summary;
  const title = row.meeting_title || "";
  const summary = ai?.summary || "";
  let s = municipalEconomicKeywordScore(`${title} ${summary}`);

  const econ = ai?.dna_impact?.economy;
  if (typeof econ === "number" && Number.isFinite(econ)) {
    s += Math.min(80, econ * 35);
  }

  const fr = ai?.friction_index;
  if (typeof fr === "number" && fr > 40) {
    s += Math.min(40, (fr - 40) * 0.6);
  }

  const est = ai?.deep_analysis?.economic_impact?.total_cost_estimate;
  if (typeof est === "number" && est > 0) {
    s += Math.min(100, 20 + Math.log10(est + 1) * 16);
  }

  return s;
}

export function parseMunicipalDateKey(row: Record<string, unknown>): number {
  const raw =
    (row.decision_date as string | undefined) ||
    (row.meeting_date as string | undefined) ||
    (row.created_at as string | undefined);
  if (!raw) return 0;
  const t = new Date(raw).getTime();
  return Number.isFinite(t) ? t : 0;
}

export function compareKuntavahtiListPriority(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
  financialScore: (row: Record<string, unknown>) => number,
): number {
  const ta = kuntavahtiBodyTier(a as any);
  const tb = kuntavahtiBodyTier(b as any);
  if (ta !== tb) return ta - tb;

  const fa = financialScore(a);
  const fb = financialScore(b);
  if (fa !== fb) return fb - fa;

  return parseMunicipalDateKey(b) - parseMunicipalDateKey(a);
}

/** meeting_analysis -syötteelle (Kuntavahti-feed) */
export function compareMunicipalWatchItems(
  a: {
    meeting_title?: string | null;
    meeting_date?: string | null;
    ai_summary?: {
      summary?: string;
      dna_impact?: Record<string, number>;
      friction_index?: number;
      deep_analysis?: { economic_impact?: { total_cost_estimate?: number } };
    } | null;
  },
  b: {
    meeting_title?: string | null;
    meeting_date?: string | null;
    ai_summary?: {
      summary?: string;
      dna_impact?: Record<string, number>;
      friction_index?: number;
      deep_analysis?: { economic_impact?: { total_cost_estimate?: number } };
    } | null;
  },
): number {
  const ta = kuntavahtiBodyTier({
    meeting_title: a.meeting_title,
    summary: a.ai_summary?.summary,
  });
  const tb = kuntavahtiBodyTier({
    meeting_title: b.meeting_title,
    summary: b.ai_summary?.summary,
  });
  if (ta !== tb) return ta - tb;

  const fa = meetingAnalysisFinancialScore(a);
  const fb = meetingAnalysisFinancialScore(b);
  if (fa !== fb) return fb - fa;

  const da = new Date(a.meeting_date || 0).getTime();
  const db = new Date(b.meeting_date || 0).getTime();
  return (Number.isFinite(db) ? db : 0) - (Number.isFinite(da) ? da : 0);
}
