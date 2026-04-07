import { fetchMediaWatchFeed } from "@/app/actions/media-watch";
import { MediaWatchComparisonList } from "@/components/dashboard/media-watch/MediaWatchComparisonList";
import Navbar from "@/components/Navbar";
import { getUser } from "@/app/actions/auth";
import Link from "next/link";
import { isFeatureEnabled } from "@/lib/config/features";
import { ArrowLeft, Scale } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Media Watch | Omatase",
  description: "Median ja lainsäädännön vertailu — Eduskuntavahti",
};

export const revalidate = 120;

export default async function MediaWatchDashboardPage() {
  const user = await getUser();
  const enabled = isFeatureEnabled("MEDIA_WATCH_ENABLED");
  const rows = enabled ? await fetchMediaWatchFeed(30) : [];

  return (
    <div className="min-h-screen bg-nordic-white dark:bg-slate-950">
      <Navbar user={user} />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-[var(--accent-primary)] dark:text-slate-400"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              Työpöytä
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]">
                <Scale className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  Media Watch
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Vertaa uutisointia viralliseen päätöstekstiin — Omatase /
                  Eduskuntavahti
                </p>
              </div>
            </div>
          </div>
        </div>

        {!enabled ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-6 text-amber-100">
            <p className="text-sm">
              Media Watch on poissa käytöstä (
              <code className="rounded bg-slate-900 px-1">
                NEXT_PUBLIC_MEDIA_WATCH_ENABLED
              </code>
              ).
            </p>
          </div>
        ) : (
          <MediaWatchComparisonList rows={rows} />
        )}
      </main>
    </div>
  );
}
