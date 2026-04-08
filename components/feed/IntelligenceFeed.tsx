"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Newspaper,
  MapPin,
  FileText,
  Radio,
  ShieldCheck,
  AlertCircle,
  ArrowUpRight,
  Sparkles,
  Link2,
  AlertTriangle,
  Users,
} from "lucide-react";
import { calculateFeedRelevance } from "@/lib/feed/relevance";
import { logUserActivity } from "@/app/actions/logUserActivity";
import type { ActionType } from "@/lib/influence/xp-engine";
import type { FeedItem } from "@/lib/feed/feed-service";
import { Badge } from "@/components/ui/badge";
import { LobbyInfluenceDrawer } from "@/components/lobby/LobbyInfluenceDrawer";

function lobbyIntensityBadgeText(count: number): string {
  if (count <= 0) return "Ei lausuntoja";
  if (count <= 2) return `Matala · ${count}`;
  if (count <= 6) return `Kohtuullinen · ${count}`;
  return `Korkea · ${count}`;
}

function feedIcon(type: FeedItem["type"]) {
  switch (type) {
    case "news":
      return { Icon: Newspaper, box: "bg-neutral-100 text-neutral-700" };
    case "local":
      return { Icon: MapPin, box: "bg-neutral-100 text-neutral-800" };
    case "bill":
      return { Icon: FileText, box: "bg-neutral-900 text-white" };
    case "media_match":
      return { Icon: Radio, box: "bg-neutral-100 text-neutral-800" };
    default:
      return { Icon: Newspaper, box: "bg-neutral-100 text-neutral-600" };
  }
}

function logTypeForItem(type: FeedItem["type"]): ActionType {
  if (type === "local") return "READ_LOCAL";
  return "NEWS_INTERACTION";
}

function primaryCtaLabel(item: FeedItem): string {
  if (item.type === "bill") return "Avaa laki";
  if (item.type === "local") return "Lue lisää";
  return "Lue lisää";
}

export function IntelligenceFeed({
  items,
  userDna,
}: {
  items: FeedItem[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userDna?: any;
}) {
  const [influenceOpen, setInfluenceOpen] = useState(false);
  const [influenceBillId, setInfluenceBillId] = useState<string | null>(null);
  const [influenceTitle, setInfluenceTitle] = useState<string | undefined>();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return `Tänään ${date.toLocaleTimeString("fi-FI", { hour: "2-digit", minute: "2-digit" })}`;
    }
    return date.toLocaleDateString("fi-FI", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });
  };

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-16 text-center transition-colors">
        <p className="font-medium text-neutral-600">
          Ei uusia päivityksiä juuri nyt.
        </p>
        <p className="mt-2 text-sm text-neutral-500">
          Palaa myöhemmin tai vaihda näkymää valikkoon.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-3xl space-y-6">
        {items.map((item) => {
          const relevance =
            userDna && item.political_vector
              ? calculateFeedRelevance(userDna, item.political_vector)
              : null;

          const { Icon, box } = feedIcon(item.type);
          const isExternal = /^https?:\/\//i.test(item.link);

          const onActivate = () => {
            logUserActivity(logTypeForItem(item.type), {
              id: item.id,
              title: item.title,
              political_vector: item.political_vector,
            });
          };

          const grounds = item.groundingSources?.length
            ? item.groundingSources
            : [{ label: item.source, url: item.link }];

          return (
            <article
              key={item.id}
              className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all duration-200 hover:border-neutral-400 hover:shadow-md"
            >
              <div className="p-6 md:p-8 md:pb-6">
                {item.imageUrl ? (
                  <div className="relative mb-6 aspect-video w-full overflow-hidden rounded-xl bg-neutral-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt=""
                      width={960}
                      height={540}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </div>
                ) : null}

                <div className="flex gap-4 md:gap-5">
                  <div
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${box} transition-transform duration-200 group-hover:scale-105`}
                  >
                    <Icon size={20} aria-hidden />
                  </div>

                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2 gap-y-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                        {item.source}
                      </span>
                      <span className="hidden text-neutral-300 sm:inline">
                        ·
                      </span>
                      <time
                        className="text-[11px] font-medium text-neutral-500"
                        dateTime={item.date}
                      >
                        {formatDate(item.date)}
                      </time>
                      {item.verifiedOfficial ? (
                        <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-900">
                          <ShieldCheck size={12} aria-hidden />
                          Vahvistettu data
                        </span>
                      ) : null}
                      {relevance &&
                      (relevance.alignments.length > 0 ||
                        relevance.conflicts.length > 0) ? (
                        <span className="inline-flex items-center gap-1 rounded border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] font-semibold text-neutral-700">
                          {relevance.alignments.length > 0 ? (
                            <>
                              <ShieldCheck
                                size={12}
                                className="text-emerald-600"
                              />
                              Sopii profiiliisi
                            </>
                          ) : (
                            <>
                              <AlertCircle
                                size={12}
                                className="text-amber-600"
                              />
                              Haastaa profiilia
                            </>
                          )}
                        </span>
                      ) : null}
                    </div>

                    <h3
                      className={`font-[family-name:var(--font-news-serif)] font-semibold leading-snug tracking-tight text-neutral-900 ${
                        item.type === "bill"
                          ? "text-2xl md:text-3xl"
                          : "text-xl md:text-2xl"
                      }`}
                    >
                      {item.title}
                    </h3>

                    <p
                      className={`leading-relaxed ${
                        item.type === "bill"
                          ? "text-lg md:text-xl font-medium text-neutral-800 line-clamp-6 md:line-clamp-8"
                          : "text-base text-neutral-600 line-clamp-3"
                      }`}
                    >
                      {item.description}
                    </p>

                    {item.political_vector ? (
                      <div className="flex h-1 w-full overflow-hidden rounded-full bg-neutral-100">
                        {Object.entries(item.political_vector).map(
                          ([key, val]) => (
                            <div
                              key={key}
                              className={`h-full flex-1 ${
                                (val as number) > 0.2
                                  ? "bg-neutral-700"
                                  : (val as number) < -0.2
                                    ? "bg-neutral-400"
                                    : "bg-neutral-200"
                              }`}
                              title={`${key}: ${val}`}
                            />
                          ),
                        )}
                      </div>
                    ) : null}

                    <div className="flex flex-wrap gap-2 pt-1">
                      {item.category === "INVESTOINTI" ? (
                        <span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-800">
                          Investointi
                        </span>
                      ) : null}
                      {item.category === "SÄÄSTÖ" ? (
                        <span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-800">
                          Säästö
                        </span>
                      ) : null}
                      {item.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-neutral-50 px-2 py-0.5 text-[10px] font-medium text-neutral-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {item.type === "bill" &&
                    item.passageProbabilityPercent != null &&
                    item.lobbyInfluenceIndex != null ? (
                      <div
                        className="grid gap-3 pt-2 sm:grid-cols-2"
                        aria-label="Lakikortin otteet"
                      >
                        <div className="rounded-xl border border-sky-200 bg-sky-50/90 px-3 py-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-sky-950">
                            Läpimenon todennäköisyys
                          </p>
                          <p className="mt-0.5 text-[11px] text-sky-800">
                            Heuristiikka istumajakaumasta (varjo-analyysi)
                          </p>
                          <div
                            className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-sky-200"
                            role="progressbar"
                            aria-valuenow={item.passageProbabilityPercent}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          >
                            <div
                              className="h-full rounded-full bg-sky-600 transition-[width]"
                              style={{
                                width: `${item.passageProbabilityPercent}%`,
                              }}
                            />
                          </div>
                          <p className="mt-1.5 text-lg font-black tabular-nums text-sky-950">
                            {item.passageProbabilityPercent}%
                          </p>
                        </div>
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 px-3 py-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-950">
                            Lobbyist Traceability
                          </p>
                          <p className="mt-0.5 text-[11px] text-emerald-900">
                            Vaikutusindeksi &amp; lausuntojen määrä
                          </p>
                          <div
                            className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-emerald-200"
                            role="progressbar"
                            aria-valuenow={item.lobbyInfluenceIndex}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          >
                            <div
                              className="h-full rounded-full bg-emerald-600"
                              style={{
                                width: `${item.lobbyInfluenceIndex}%`,
                              }}
                            />
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="text-lg font-black tabular-nums text-emerald-950">
                              {item.lobbyInfluenceIndex}
                              <span className="text-xs font-semibold text-emerald-800">
                                /100
                              </span>
                            </span>
                            <Badge
                              variant="outline"
                              className="inline-flex items-center gap-1 border-emerald-300 bg-white/80 text-[10px] font-medium normal-case text-emerald-950"
                            >
                              <Users className="h-3 w-3 shrink-0" aria-hidden />
                              {lobbyIntensityBadgeText(
                                item.lobbyInterventionCount ?? 0,
                              )}
                            </Badge>
                          </div>
                          {item.interestSectorConflict ? (
                            <span
                              className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-amber-900"
                              title="Sidonnaisuusrekisterin järjestö vastaa aihealuetta tai otsikkoa (heuristiikka)."
                            >
                              <AlertTriangle
                                className="h-3.5 w-3.5 shrink-0"
                                aria-hidden
                              />
                              Mahdollinen sidonnaisuus
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ) : null}

                    <div className="border-t border-neutral-100 pt-4">
                      <p className="mb-2 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                        <Link2 size={12} aria-hidden />
                        Lähteet
                      </p>
                      <ul className="flex flex-wrap gap-x-4 gap-y-2">
                        {grounds.slice(0, 4).map((g) => (
                          <li key={`${g.label}-${g.url}`}>
                            <a
                              href={g.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-neutral-800 underline decoration-neutral-300 underline-offset-4 transition-colors hover:decoration-neutral-900"
                            >
                              {g.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t border-neutral-100 bg-neutral-50/80 px-6 py-4 md:flex-row md:items-center md:justify-between md:px-8">
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  {isExternal ? (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={onActivate}
                      className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-neutral-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-[0.99]"
                    >
                      {primaryCtaLabel(item)}
                      <ArrowUpRight size={16} aria-hidden />
                    </a>
                  ) : (
                    <Link
                      href={item.link}
                      onClick={onActivate}
                      className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-neutral-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-[0.99]"
                    >
                      {primaryCtaLabel(item)}
                    </Link>
                  )}
                  {item.takeActionHref ? (
                    <Link
                      href={item.takeActionHref}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg border border-neutral-400 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-800 transition-all hover:bg-neutral-50 sm:order-last"
                    >
                      <Sparkles
                        size={14}
                        className="text-amber-600"
                        aria-hidden
                      />
                      Vaikuta (kansanedustaja)
                    </Link>
                  ) : null}
                  {item.type === "bill" && item.billUuid ? (
                    <button
                      type="button"
                      onClick={() => {
                        setInfluenceBillId(item.billUuid!);
                        setInfluenceTitle(item.title);
                        setInfluenceOpen(true);
                      }}
                      className="inline-flex min-h-[40px] items-center justify-center gap-1 rounded-md border border-dashed border-neutral-400 bg-transparent px-3 py-2 text-xs font-medium text-neutral-600 hover:bg-white/80"
                    >
                      Syvempi lobby-analyysi…
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <LobbyInfluenceDrawer
        billId={influenceBillId}
        open={influenceOpen}
        onOpenChange={(o) => {
          setInfluenceOpen(o);
          if (!o) setInfluenceBillId(null);
        }}
        headline={influenceTitle}
      />
    </>
  );
}

export function IntelligenceFeedSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6" aria-hidden>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-neutral-100 bg-white p-6 md:p-8"
        >
          <div className="flex gap-4">
            <div className="h-10 w-10 shrink-0 rounded-lg bg-neutral-200" />
            <div className="flex-1 space-y-3">
              <div className="h-3 w-1/3 rounded bg-neutral-200" />
              <div className="h-6 w-4/5 rounded bg-neutral-200" />
              <div className="h-4 w-full rounded bg-neutral-200" />
              <div className="h-4 w-5/6 rounded bg-neutral-200" />
              <div className="h-3 w-1/2 rounded bg-neutral-200" />
            </div>
          </div>
          <div className="mt-6 h-11 w-full rounded-lg bg-neutral-200 sm:w-40" />
        </div>
      ))}
    </div>
  );
}
