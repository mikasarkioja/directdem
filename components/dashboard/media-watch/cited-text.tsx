"use client";

import type { ReactNode } from "react";
import type {
  MediaWatchGroundingSource,
  MediaWatchGroundingSupport,
} from "@/lib/media-watch/grounding";

function sourceTooltip(
  sources: MediaWatchGroundingSource[],
  idx: number,
): string {
  const s = sources[idx];
  if (!s) return `Lähde ${idx + 1}`;
  return [s.title, s.url].filter(Boolean).join(" — ");
}

/** Lisää groundingSupports-mukaiset yläviitteet ensimmäisiin osumiin (ei päällekkäisiä). */
export function renderWithInlineCitations(
  text: string,
  supports: MediaWatchGroundingSupport[],
  sources: MediaWatchGroundingSource[],
): ReactNode {
  if (!text.trim()) return text;
  if (!supports.length || !sources.length) return text;

  type Cand = {
    s: MediaWatchGroundingSupport;
    start: number;
    end: number;
  };

  const candidates: Cand[] = supports
    .filter((s) =>
      s.segmentText.length >= 4
        ? s.sourceIndices.some((i) => i >= 0 && i < sources.length)
        : false,
    )
    .map((s) => {
      const start = text.indexOf(s.segmentText);
      return { s, start, end: start + s.segmentText.length };
    })
    .filter((x) => x.start >= 0)
    .sort((a, b) => b.s.segmentText.length - a.s.segmentText.length);

  const picked: Cand[] = [];
  const occupied: { start: number; end: number }[] = [];

  outer: for (const x of candidates) {
    for (const o of occupied) {
      if (x.start < o.end && x.end > o.start) continue outer;
    }
    occupied.push({ start: x.start, end: x.end });
    picked.push(x);
  }

  picked.sort((a, b) => a.start - b.start);

  const parts: ReactNode[] = [];
  let cursor = 0;
  let k = 0;
  for (const x of picked) {
    if (cursor < x.start) {
      parts.push(text.slice(cursor, x.start));
    }
    const refs = [...new Set(x.s.sourceIndices)].filter(
      (i) => i >= 0 && i < sources.length,
    );
    parts.push(
      <span key={`cit-${k++}`}>
        {text.slice(x.start, x.end)}
        {refs.map((idx) => (
          <sup
            key={idx}
            className="ml-0.5 cursor-help align-super text-[0.7em] font-semibold text-[var(--accent-primary)]"
            title={sourceTooltip(sources, idx)}
          >
            [{idx + 1}]
          </sup>
        ))}
      </span>,
    );
    cursor = x.end;
  }
  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }
  return <>{parts}</>;
}
