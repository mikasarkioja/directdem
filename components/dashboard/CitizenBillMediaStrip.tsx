"use client";

import { useEffect, useState } from "react";
import {
  fetchMediaWatchMatchesForBill,
  type MediaWatchFeedRow,
} from "@/app/actions/media-watch";
import type { MediaWatchAiSummary } from "@/lib/media-watch/gemini-analysis";
import { ArrowUpRight, Loader2, Newspaper, ShieldCheck } from "lucide-react";

function parseAnalysis(
  raw: MediaWatchFeedRow["ai_analysis_summary"],
): MediaWatchAiSummary | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.accuracyScore !== "number") return null;
  return raw as MediaWatchAiSummary;
}

interface CitizenBillMediaStripProps {
  billId: string;
  parliamentId?: string | null;
}

/**
 * Näyttää Media Watch -rivit, jotka on sidottu tähän HE-lakiin (bill_id / HE-tunnus).
 */
export default function CitizenBillMediaStrip({
  billId,
  parliamentId,
}: CitizenBillMediaStripProps) {
  const [rows, setRows] = useState<MediaWatchFeedRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      const data = await fetchMediaWatchMatchesForBill(billId, {
        parliamentId,
        limit: 8,
      });
      if (!cancelled) {
        setRows(data);
        setLoading(false);
      }
    }
    if (billId) run();
    return () => {
      cancelled = true;
    };
  }, [billId, parliamentId]);

  if (loading) {
    return (
      <section
        aria-label="Lakiin liittyvä media"
        className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 flex items-center gap-3 text-slate-500"
      >
        <Loader2 className="animate-spin shrink-0" size={18} />
        <span className="text-[10px] font-bold uppercase tracking-widest">
          Haetaan mediaosuummia…
        </span>
      </section>
    );
  }

  if (rows.length === 0) {
    return (
      <section
        aria-label="Lakiin liittyvä media"
        className="rounded-2xl border border-dashed border-white/15 bg-slate-950/30 p-5"
      >
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 flex items-center gap-2">
          <Newspaper size={14} className="text-slate-600" />
          Media ja tämä laki
        </p>
        <p className="text-xs text-slate-500 leading-relaxed">
          Ei vielä automaattisesti linkitettyjä uutisia tälle esitykselle
          {parliamentId ? ` (${parliamentId})` : ""}. Osumat syntyvät, kun Media
          Watch -synkronointi löytää lähellä olevaa sisältöä ja Gemini
          analyysin.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Lakiin liittyvä media"
      className="rounded-2xl border border-purple-500/25 bg-purple-950/20 p-5 space-y-4"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-purple-200 flex items-center gap-2">
          <Newspaper size={14} />
          Uutiset ja tämä laki
        </h3>
        <span className="text-[9px] font-bold text-slate-500 whitespace-nowrap">
          {rows.length} mediaosuuma{rows.length === 1 ? "" : "a"}
        </span>
      </div>
      <ul className="space-y-3">
        {rows.map((row) => {
          const ai = parseAnalysis(row.ai_analysis_summary);
          const badge = ai?.badge || "context";
          return (
            <li
              key={row.match_id}
              className="rounded-xl border border-white/10 bg-slate-900/50 p-3.5 space-y-2"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">
                  {row.news_source_name || "Media"}
                </span>
                {row.news_published_at && (
                  <span className="text-[8px] text-slate-600">
                    {new Date(row.news_published_at).toLocaleDateString(
                      "fi-FI",
                    )}
                  </span>
                )}
                <span
                  className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${
                    badge === "fact_check"
                      ? "border-amber-500/40 text-amber-300 bg-amber-500/10"
                      : "border-sky-500/35 text-sky-200 bg-sky-500/10"
                  }`}
                >
                  {badge === "fact_check" ? (
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck size={10} />
                      Fact check
                    </span>
                  ) : (
                    "Konteksti"
                  )}
                </span>
                {ai && (
                  <span className="text-[8px] font-bold text-emerald-400/90">
                    Tarkkuus {Math.round(ai.accuracyScore)}/100
                  </span>
                )}
              </div>
              <a
                href={row.news_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex gap-2 items-start text-sm font-semibold text-white hover:text-purple-200 leading-snug"
              >
                <span className="flex-1">{row.news_title}</span>
                <ArrowUpRight
                  size={16}
                  className="shrink-0 opacity-50 group-hover:opacity-100"
                />
              </a>
              {row.news_content && (
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {row.news_content}
                </p>
              )}
              {ai?.keyDiscrepancy ? (
                <p className="text-[10px] text-rose-200/90 leading-relaxed border-l-2 border-rose-500/40 pl-2">
                  <span className="font-black uppercase text-[8px] text-rose-300/80">
                    Huomio:{" "}
                  </span>
                  {ai.keyDiscrepancy}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
