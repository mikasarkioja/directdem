"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchMediaWatchFeed,
  type MediaWatchFeedRow,
} from "@/app/actions/media-watch";
import { syncNews } from "@/app/actions/sync-news";
import type { UserProfile } from "@/lib/types";
import type { MediaWatchAiSummary } from "@/lib/media-watch/gemini-analysis";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Loader2,
  Newspaper,
  RefreshCw,
  Scale,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

function asAnalysis(
  raw: MediaWatchFeedRow["ai_analysis_summary"],
): MediaWatchAiSummary | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.accuracyScore !== "number") return null;
  return raw as MediaWatchAiSummary;
}

function decisionHref(row: MediaWatchFeedRow): string | null {
  if (row.bill_id && row.bill_parliament_id) {
    return `/?view=bills&highlight=${encodeURIComponent(row.bill_parliament_id)}`;
  }
  if (row.bill_id) return `/?view=bills`;
  if (row.municipal_url) return row.municipal_url;
  if (row.decision_external_ref?.startsWith("http")) {
    return row.decision_external_ref;
  }
  return null;
}

function decisionLabel(row: MediaWatchFeedRow): string {
  if (row.bill_title && row.bill_parliament_id) {
    return `${row.bill_parliament_id}: ${row.bill_title}`;
  }
  if (row.bill_title) return row.bill_title;
  if (row.municipal_title) {
    const m = row.municipal_municipality
      ? ` (${row.municipal_municipality})`
      : "";
    return `${row.municipal_title}${m}`;
  }
  if (row.decision_title) return row.decision_title;
  return "Linkitetty päätös / laki";
}

function decisionSummary(row: MediaWatchFeedRow): string {
  return (
    row.bill_summary ||
    row.municipal_summary ||
    row.decision_summary ||
    ""
  ).slice(0, 420);
}

export default function MediaWatchPanel({
  user,
}: {
  user: UserProfile | null;
}) {
  const [rows, setRows] = useState<MediaWatchFeedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const canSync = user?.is_admin === true;

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchMediaWatchFeed(45);
    setRows(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onSync = async () => {
    setSyncing(true);
    try {
      const r = await syncNews();
      if (!r.ok) {
        toast.error(r.error || "Sykronointi epäonnistui.");
        return;
      }
      toast.success(
        `Uutisrivejä ${r.insertedArticles}, uusia osumia ${r.newMatches}. Korpus-embeddingit: lakia ${r.embeddingBackfill.bills}, päätöksiä ${r.embeddingBackfill.decisions}, kuntia ${r.embeddingBackfill.municipal}.`,
      );
      await load();
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-purple-400">
            <Newspaper size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Eduskuntavahti
            </span>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white leading-none">
            Media Watch
          </h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest max-w-xl leading-relaxed">
            Uutisten kehystys vs. päätös- ja laintieto. Osumat semanttisen haun
            ja Geminin analyysin kautta (kynnys 0,85).
          </p>
        </div>
        {canSync && (
          <button
            type="button"
            disabled={syncing}
            onClick={onSync}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-[10px] font-black uppercase tracking-widest text-white transition-colors"
          >
            {syncing ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <RefreshCw size={14} />
            )}
            Synkkaa uutiset
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-purple-400" size={36} />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-white/15 bg-slate-900/40 p-12 text-center">
          <Scale className="mx-auto text-slate-600 mb-4" size={40} />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Ei vielä osumia. Ylläpitäjä voi ajaa uutissynkronoinnin tai odota
            migraation ja korpusdatankeruun valmistumista.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {rows.map((row, i) => {
            const analysis = asAnalysis(row.ai_analysis_summary);
            const href = decisionHref(row);
            const badge = analysis?.badge || "context";
            const badgeClass =
              badge === "fact_check"
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-sky-500/20 text-sky-200 border-sky-500/35";

            return (
              <motion.div
                key={row.match_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.4) }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-[1.75rem] overflow-hidden border border-white/10 bg-slate-900/60 shadow-xl"
              >
                <div className="p-6 md:p-8 border-b lg:border-b-0 lg:border-r border-white/10 space-y-3 min-h-[180px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">
                      {row.news_source_name || "Media"}
                    </span>
                    {row.news_published_at && (
                      <span className="text-[8px] text-slate-600">
                        {new Date(row.news_published_at).toLocaleString(
                          "fi-FI",
                        )}
                      </span>
                    )}
                  </div>
                  <a
                    href={row.news_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex gap-2 items-start text-white hover:text-purple-300 transition-colors"
                  >
                    <h3 className="text-base md:text-lg font-black uppercase tracking-tight leading-snug flex-1">
                      {row.news_title}
                    </h3>
                    <ArrowUpRight
                      size={18}
                      className="shrink-0 opacity-50 group-hover:opacity-100"
                    />
                  </a>
                  {row.news_content && (
                    <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3">
                      {row.news_content}
                    </p>
                  )}
                </div>

                <div className="p-6 md:p-8 space-y-4 bg-slate-950/40">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[8px] font-black uppercase tracking-widest ${badgeClass}`}
                    >
                      {badge === "fact_check" ? (
                        <ShieldCheck size={12} />
                      ) : null}
                      {badge === "fact_check" ? "Fact check" : "Konteksti"}
                    </span>
                    <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest">
                      similarity {(row.similarity_score * 100).toFixed(1)}%
                    </span>
                    {analysis && (
                      <span className="text-[8px] font-black uppercase text-emerald-400/90 tracking-widest">
                        tarkkuus {Math.round(analysis.accuracyScore)} / 100
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">
                      Päätös / laki
                    </p>
                    {href ? (
                      <Link
                        href={href}
                        className="text-sm font-black uppercase tracking-tight text-purple-200 hover:text-white flex items-start gap-2"
                      >
                        <span className="flex-1 leading-snug">
                          {decisionLabel(row)}
                        </span>
                        <ArrowUpRight
                          size={16}
                          className="shrink-0 opacity-60"
                        />
                      </Link>
                    ) : (
                      <p className="text-sm font-black uppercase tracking-tight text-slate-200 leading-snug">
                        {decisionLabel(row)}
                      </p>
                    )}
                    {decisionSummary(row) && (
                      <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-4">
                        {decisionSummary(row)}
                      </p>
                    )}
                  </div>

                  {analysis?.keyDiscrepancy && (
                    <div className="rounded-xl border border-rose-500/25 bg-rose-500/5 p-3 space-y-1">
                      <p className="text-[8px] font-black uppercase tracking-widest text-rose-300/90">
                        Keskeinen ero / puute
                      </p>
                      <p className="text-[11px] text-rose-100/90 leading-relaxed">
                        {analysis.keyDiscrepancy}
                      </p>
                    </div>
                  )}

                  {analysis?.politicalContext && (
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-1">
                      <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                        Poliittinen kehys
                      </p>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {analysis.politicalContext}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
