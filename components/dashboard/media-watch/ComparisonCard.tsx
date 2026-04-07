"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import type { MediaWatchFeedRow } from "@/app/actions/media-watch";
import { matchNewsToDecision } from "@/app/actions/media-matcher";
import { normalizeMediaWatchAnalysis } from "@/lib/media-watch/comparison-analysis";
import type { MediaWatchComparisonAnalysis } from "@/lib/media-watch/comparison-analysis";
import {
  parseAiAnalysisJson,
  type MediaWatchAiAnalysisJson,
} from "@/lib/media-watch/grounding";
import { renderWithInlineCitations } from "@/components/dashboard/media-watch/cited-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Gavel,
  Loader2,
  Newspaper,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

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
  ).trim();
}

function legislativeStatus(row: MediaWatchFeedRow): string {
  if (row.bill_parliament_id) return `Lakiesitys · ${row.bill_parliament_id}`;
  if (row.municipal_municipality) {
    return `Kunnallinen · ${row.municipal_municipality}`;
  }
  if (row.decision_external_ref?.trim()) {
    return `Viite: ${row.decision_external_ref.slice(0, 80)}`;
  }
  return "Virallinen päätös / dokumentti";
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

function newsSnippet(row: MediaWatchFeedRow, max = 400): string {
  const t = (row.news_content ?? "").trim();
  if (!t) return "Ei tekstikatkelmaa saatavilla.";
  return t.length <= max ? t : `${t.slice(0, max).trim()}…`;
}

export function ComparisonCard({ row }: { row: MediaWatchFeedRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [localAnalysis, setLocalAnalysis] =
    useState<MediaWatchComparisonAnalysis | null>(() =>
      normalizeMediaWatchAnalysis(row.ai_analysis_summary),
    );

  const [localGrounding, setLocalGrounding] =
    useState<MediaWatchAiAnalysisJson>(() =>
      parseAiAnalysisJson(row.ai_analysis_json),
    );

  const summaryBlob = JSON.stringify(row.ai_analysis_summary ?? null);
  useEffect(() => {
    setLocalAnalysis(normalizeMediaWatchAnalysis(row.ai_analysis_summary));
  }, [row.match_id, summaryBlob]); // eslint-disable-line react-hooks/exhaustive-deps -- summaryBlob serializes ai_analysis_summary

  const groundingBlob = JSON.stringify(row.ai_analysis_json ?? null);
  useEffect(() => {
    setLocalGrounding(parseAiAnalysisJson(row.ai_analysis_json));
  }, [row.match_id, groundingBlob]); // eslint-disable-line react-hooks/exhaustive-deps -- groundingBlob serializes ai_analysis_json

  const analysis =
    localAnalysis ?? normalizeMediaWatchAnalysis(row.ai_analysis_summary);

  const runAnalysis = useCallback(() => {
    startTransition(async () => {
      const res = await matchNewsToDecision(row.match_id);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      setLocalAnalysis(res.analysis);
      setLocalGrounding(res.grounding);
      toast.success("Analyysi valmis.");
      router.refresh();
    });
  }, [row.match_id, router]);

  const accuracy = analysis?.accuracyScore ?? null;
  const discrepancies = analysis?.discrepancies ?? [];
  const framing = analysis?.framing?.trim() ?? "";
  const selko = analysis?.selkokieliSummary?.trim() ?? "";

  const grounding = localGrounding;
  const sources = grounding.sources ?? [];
  const supports = grounding.supports ?? [];
  const showVerifyBadge =
    grounding.groundingUsed === true && sources.length > 0;

  return (
    <Card className="overflow-hidden border-slate-800/80 bg-slate-950/50">
      <CardHeader className="space-y-1 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold text-slate-100">
              Media vs. päätös
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Osuma · similarity{" "}
              {row.similarity_score != null
                ? `${Math.round(row.similarity_score * 100)} %`
                : "—"}
            </CardDescription>
          </div>
          <Button
            type="button"
            disabled={isPending}
            onClick={runAnalysis}
            className="gap-2 bg-[var(--accent-primary)] px-3 py-2 text-sm text-slate-950 hover:opacity-90"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="h-4 w-4" aria-hidden />
            )}
            Käynnistä AI-analyysi
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
          {/* News column */}
          <div className="flex flex-col rounded-lg border border-slate-800/90 bg-slate-900/40 p-4">
            <div className="mb-3 flex items-center gap-2 text-[var(--accent-primary)]">
              <Newspaper className="h-4 w-4 shrink-0" aria-hidden />
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Uutinen
              </span>
            </div>
            <h4 className="text-sm font-semibold leading-snug text-slate-100">
              {row.news_title}
            </h4>
            <p className="mt-1 text-xs text-slate-500">
              {(row.news_source_name ?? "Lähde tuntematon") +
                (row.news_published_at
                  ? ` · ${new Date(row.news_published_at).toLocaleDateString(
                      "fi-FI",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      },
                    )}`
                  : "")}
            </p>
            <ScrollArea
              className="mt-3 text-sm leading-relaxed text-slate-300 custom-scrollbar"
              maxHeight="min(220px, 40vh)"
            >
              {newsSnippet(row)}
            </ScrollArea>
            {row.news_url ? (
              <Link
                href={row.news_url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 text-xs font-medium text-[var(--accent-primary)] underline-offset-2 hover:underline"
              >
                Avaa alkuperäinen artikkeli
              </Link>
            ) : null}
          </div>

          {/* Legislative column */}
          <div className="flex flex-col rounded-lg border border-slate-800/90 bg-slate-900/40 p-4">
            <div className="mb-3 flex items-center gap-2 text-[var(--accent-primary)]">
              <Gavel className="h-4 w-4 shrink-0" aria-hidden />
              <span className="text-[11px] font-bold uppercase tracking-wider">
                Lainsäädäntö / päätös
              </span>
            </div>
            <h4 className="text-sm font-semibold leading-snug text-slate-100">
              {decisionLabel(row)}
            </h4>
            <p className="mt-1 text-xs text-slate-500">
              {legislativeStatus(row)}
            </p>
            <ScrollArea
              className="mt-3 text-sm leading-relaxed text-slate-300 custom-scrollbar"
              maxHeight="min(220px, 40vh)"
            >
              {decisionSummary(row) || "Tiivistelmää ei ole tallennettu."}
            </ScrollArea>
            {decisionHref(row) ? (
              <Link
                href={decisionHref(row)!}
                target={
                  decisionHref(row)!.startsWith("http") ? "_blank" : undefined
                }
                rel={
                  decisionHref(row)!.startsWith("http")
                    ? "noreferrer"
                    : undefined
                }
                className="mt-3 text-xs font-medium text-[var(--accent-primary)] underline-offset-2 hover:underline"
              >
                Siirry kohteeseen
              </Link>
            ) : null}
          </div>
        </div>

        <Separator className="bg-slate-800" />

        {/* Analysis overlay */}
        <div
          className="relative rounded-lg border border-slate-800/80 bg-slate-900/30 p-4"
          aria-busy={isPending}
        >
          {isPending ? (
            <div className="space-y-3" aria-live="polite">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <div className="flex flex-wrap gap-2 pt-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-28" />
              </div>
            </div>
          ) : analysis ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                {showVerifyBadge ? (
                  <Badge
                    variant="outline"
                    className="gap-1 border-sky-500/40 bg-sky-950/40 text-sky-200"
                  >
                    <ExternalLink className="h-3 w-3" aria-hidden />
                    Tarkistettu Google-haulla
                  </Badge>
                ) : null}
              </div>

              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Totuusmittari
                  </span>
                  {accuracy != null ? (
                    <span className="text-sm font-semibold tabular-nums text-slate-200">
                      {accuracy} / 100
                    </span>
                  ) : null}
                </div>
                {accuracy != null ? (
                  <Progress
                    value={accuracy}
                    className="h-2.5 bg-slate-800/90 [&>div]:bg-[var(--accent-primary)] [&>div]:from-[var(--accent-primary)] [&>div]:to-[var(--accent-primary)] [&>div]:bg-gradient-to-r"
                  />
                ) : (
                  <p className="text-sm text-slate-500">
                    Ei pisteytystä — käynnistä analyysi.
                  </p>
                )}
              </div>

              {discrepancies.length > 0 ? (
                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Erot ja faktat
                  </p>
                  <ul className="flex flex-col gap-2">
                    {discrepancies.map((d, i) => (
                      <li key={i} className="flex items-start gap-2">
                        {d.kind === "error" ? (
                          <AlertTriangle
                            className="mt-0.5 h-4 w-4 shrink-0 text-rose-400"
                            aria-hidden
                          />
                        ) : (
                          <CheckCircle
                            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
                            aria-hidden
                          />
                        )}
                        <Badge
                          variant={
                            d.kind === "error" ? "destructive" : "success"
                          }
                          className="max-w-full whitespace-normal text-left font-normal leading-snug"
                        >
                          {renderWithInlineCitations(d.text, supports, sources)}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Ei listattuja eroja — analyysi tai tyhjä lista.
                </p>
              )}

              {framing ? (
                <div className="rounded-md border border-slate-800 bg-slate-950/40 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Kehystäminen
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-200">
                    {renderWithInlineCitations(framing, supports, sources)}
                  </p>
                </div>
              ) : null}

              {selko ? (
                <blockquote className="border-l-4 border-[var(--accent-primary)] bg-slate-950/50 py-3 pl-4 pr-2 text-base font-medium leading-relaxed text-slate-100">
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-[var(--accent-primary)]">
                    Selkokieli
                  </span>
                  {renderWithInlineCitations(selko, supports, sources)}
                </blockquote>
              ) : null}

              <Separator className="bg-slate-800" />

              <div>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Lähteet ja viitteet
                </p>
                {sources.length > 0 ? (
                  <ol className="list-decimal space-y-2 pl-4 text-sm text-slate-300 marker:text-[var(--accent-primary)]">
                    {sources.map((src, i) => (
                      <li key={`${src.url}-${i}`} className="pl-1">
                        <span className="font-medium text-slate-200">
                          {src.title}
                        </span>
                        {src.url ? (
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-primary)] underline-offset-2 hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" aria-hidden />
                            Avaa
                          </a>
                        ) : null}
                        {src.snippet ? (
                          <p className="mt-1 text-xs text-slate-500">
                            {src.snippet}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm leading-relaxed text-slate-500">
                    Analyysi perustuu vain annettuihin dokumentteihin. Google
                    Search -lähteitä ei löytynyt tai hakua ei käytetty.
                  </p>
                )}
                {grounding.webSearchQueries &&
                grounding.webSearchQueries.length > 0 ? (
                  <div className="mt-4 rounded-md border border-slate-800 bg-slate-950/30 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Hakukyselyt
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {grounding.webSearchQueries.map((q) => (
                        <Badge
                          key={q}
                          variant="outline"
                          className="font-normal"
                        >
                          {q}
                        </Badge>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Analyysiä ei vielä ole. Paina &quot;Käynnistä AI-analyysi&quot; —
              käytössä on malli{" "}
              <code className="rounded bg-slate-800 px-1 text-xs">
                GEMINI_MEDIA_WATCH_MODEL
              </code>{" "}
              (oletus gemini-3-flash-preview).
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
