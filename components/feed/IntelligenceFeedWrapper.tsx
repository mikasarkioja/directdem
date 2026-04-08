"use client";

import React, { useState, useMemo } from "react";
import { IntelligenceFeed } from "./IntelligenceFeed";
import { Filter, Sparkles } from "lucide-react";
import Link from "next/link";
import type { FeedItem } from "@/lib/feed/feed-service";
import { isResearcherWorkbenchEnabled } from "@/lib/config/features";

export default function IntelligenceFeedWrapper({
  initialItems,
  userDna,
  variant = "default",
}: {
  initialItems: FeedItem[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userDna: any;
  variant?: "default" | "citizen";
}) {
  const [showOnlyRelevant, setShowOnlyRelevant] = useState(false);

  const filteredItems = useMemo(() => {
    if (!showOnlyRelevant) return initialItems;
    return [...initialItems]
      .filter((item) => (item.relevanceScore || 0) > 0.3)
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  }, [initialItems, showOnlyRelevant]);

  const title = variant === "citizen" ? "Kansalaissyöte" : "Intelligence Feed";
  const subtitle =
    variant === "citizen"
      ? "Eduskunta, kunta, media ja uutiset — lähteet merkitty"
      : "Live Analysis active";

  return (
    <section className="space-y-8 border-t border-neutral-200 pt-10 md:pt-12">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-2">
          <h2 className="font-[family-name:var(--font-news-serif)] text-3xl font-semibold tracking-tight text-neutral-900 md:text-4xl">
            {title}
          </h2>
          <p className="max-w-xl text-sm font-medium leading-relaxed text-neutral-600">
            {subtitle}
          </p>
        </div>

        <details className="group w-full md:w-auto">
          <summary className="cursor-pointer list-none rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-600 transition-colors hover:border-neutral-300 [&::-webkit-details-marker]:hidden">
            Näytä lisää — suodatus &amp; tutkija
          </summary>
          <div className="mt-3 flex flex-col gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 md:flex-row md:flex-wrap md:items-center">
            <button
              type="button"
              onClick={() => setShowOnlyRelevant(!showOnlyRelevant)}
              className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                showOnlyRelevant
                  ? "border-neutral-900 bg-neutral-900 text-white shadow-sm"
                  : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400"
              }`}
            >
              {showOnlyRelevant ? (
                <Sparkles size={16} aria-hidden />
              ) : (
                <Filter size={16} aria-hidden />
              )}
              {showOnlyRelevant ? "Vain relevanteimmat" : "Kaikki"}
            </button>
            {isResearcherWorkbenchEnabled() ? (
              <Link
                href="/dashboard/researcher"
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-100"
              >
                Tutkijan työpöytä →
              </Link>
            ) : null}
          </div>
        </details>
      </div>

      <IntelligenceFeed items={filteredItems} userDna={userDna} />
    </section>
  );
}
