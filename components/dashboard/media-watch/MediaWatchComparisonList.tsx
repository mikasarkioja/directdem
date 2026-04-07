"use client";

import type { MediaWatchFeedRow } from "@/app/actions/media-watch";
import { ComparisonCard } from "@/components/dashboard/media-watch/ComparisonCard";
import { Newspaper } from "lucide-react";

export function MediaWatchComparisonList({
  rows,
}: {
  rows: MediaWatchFeedRow[];
}) {
  if (!rows.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/30 px-6 py-16 text-center">
        <Newspaper
          className="mx-auto mb-3 h-10 w-10 text-slate-600"
          aria-hidden
        />
        <p className="text-sm font-medium text-slate-400">
          Ei mediaosuusia vielä. Synkronoi uutiset tai odota putken ajoa.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {rows.map((row) => (
        <ComparisonCard key={row.match_id} row={row} />
      ))}
    </div>
  );
}
