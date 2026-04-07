import type {
  GroundingChunk,
  GroundingMetadata,
  GroundingSupport,
  GroundingSupportSegment,
} from "@google/generative-ai";

export type MediaWatchGroundingSource = {
  title: string;
  url: string;
  snippet: string;
};

export type MediaWatchGroundingSupport = {
  segmentText: string;
  /** 0-based indices into sources */
  sourceIndices: number[];
};

export type MediaWatchAiAnalysisJson = {
  sources: MediaWatchGroundingSource[];
  groundingUsed: boolean;
  supports: MediaWatchGroundingSupport[];
  webSearchQueries?: string[];
};

export function emptyGroundingPayload(): MediaWatchAiAnalysisJson {
  return {
    sources: [],
    groundingUsed: false,
    supports: [],
  };
}

function supportIndices(s: GroundingSupport): number[] {
  const raw = s as Record<string, unknown>;
  const a =
    raw.groundingChunckIndices ??
    raw.groundingChunkIndices ??
    raw["grounding_chunk_indices"];
  if (!Array.isArray(a)) return [];
  return a.filter((n): n is number => typeof n === "number");
}

function supportSegmentText(s: GroundingSupport): string {
  const seg = s.segment;
  if (seg == null) return "";
  if (typeof seg === "string") return seg.trim();
  if (typeof seg === "object") {
    const o = seg as GroundingSupportSegment;
    return (o.text ?? "").trim();
  }
  return "";
}

/**
 * Yksi alkio per groundingChunk — indeksit viittaavat tähän järjestykseen (ei dedupe).
 */
export function buildSourcesFromGroundingChunks(
  chunks?: GroundingChunk[] | null,
): MediaWatchGroundingSource[] {
  if (!chunks?.length) return [];
  return chunks.map((chunk, index) => {
    const w = chunk.web;
    const url = (w?.uri ?? "").trim();
    const title = (w?.title ?? "").trim() || url || `Lähde ${index + 1}`;
    return {
      title,
      url,
      snippet: "",
    };
  });
}

/**
 * Gemini palauttaa indeksit groundingChunks-listaan; rakennamme lähteet samassa järjestyksessä.
 */
export function extractGroundingPayload(
  meta: GroundingMetadata | null | undefined,
): MediaWatchAiAnalysisJson {
  if (!meta) {
    return emptyGroundingPayload();
  }

  const sources = buildSourcesFromGroundingChunks(meta.groundingChunks);
  const supportsRaw = meta.groundingSupports ?? [];

  const supports: MediaWatchGroundingSupport[] = [];
  for (const s of supportsRaw) {
    const segmentText = supportSegmentText(s);
    const sourceIndices = supportIndices(s);
    if (!segmentText && sourceIndices.length === 0) continue;
    supports.push({
      segmentText,
      sourceIndices,
    });
  }

  const rawQ = meta.webSearchQueries;
  const queries = Array.isArray(rawQ) ? rawQ : [];
  const groundingUsed =
    sources.length > 0 || supports.length > 0 || queries.length > 0;

  return {
    sources,
    groundingUsed,
    supports,
    webSearchQueries: queries.length ? queries : undefined,
  };
}

export function parseAiAnalysisJson(raw: unknown): MediaWatchAiAnalysisJson {
  if (!raw || typeof raw !== "object") return emptyGroundingPayload();
  const o = raw as Record<string, unknown>;
  const sources: MediaWatchGroundingSource[] = Array.isArray(o.sources)
    ? o.sources
        .map((x) => {
          if (!x || typeof x !== "object") return null;
          const s = x as Record<string, unknown>;
          return {
            title: String(s.title ?? ""),
            url: String(s.url ?? ""),
            snippet: String(s.snippet ?? ""),
          };
        })
        .filter(
          (x): x is MediaWatchGroundingSource =>
            x != null && (!!x.url || !!x.title),
        )
    : [];
  const supports: MediaWatchGroundingSupport[] = Array.isArray(o.supports)
    ? o.supports
        .map((x) => {
          if (!x || typeof x !== "object") return null;
          const s = x as Record<string, unknown>;
          const segmentText = String(s.segmentText ?? "");
          const idx = Array.isArray(s.sourceIndices)
            ? s.sourceIndices.filter((n): n is number => typeof n === "number")
            : [];
          return { segmentText, sourceIndices: idx };
        })
        .filter((x): x is MediaWatchGroundingSupport => x != null)
    : [];
  return {
    sources,
    groundingUsed: o.groundingUsed === true,
    supports,
    webSearchQueries: Array.isArray(o.webSearchQueries)
      ? o.webSearchQueries.filter((q): q is string => typeof q === "string")
      : undefined,
  };
}
