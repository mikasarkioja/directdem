import { getUser } from "@/app/actions/auth";
import DashboardClient from "./DashboardClient";
import Navbar from "@/components/Navbar";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { fetchBillsFromSupabase } from "@/app/actions/bills-supabase";
import { fetchMunicipalDecisions } from "@/app/actions/municipal";
import { getIntelligenceFeed } from "@/lib/feed/feed-service";
import IntelligenceFeedWrapper from "@/components/feed/IntelligenceFeedWrapper";
import CitizenPulseSection from "@/components/feed/CitizenPulseSection";
import { IntelligenceFeedSkeleton } from "@/components/feed/IntelligenceFeed";
import { isFeatureEnabled } from "@/lib/config/features";
import { redirect } from "next/navigation";
import { getCachedCitizenPulseSummary } from "@/lib/feed/citizen-pulse-cache";

export const revalidate = 900;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getUser();
  const resolvedSearchParams = await searchParams;
  const viewParam = resolvedSearchParams.view;
  const view =
    (Array.isArray(viewParam) ? viewParam[0] : viewParam) || "citizen";

  if (view === "researcher") {
    redirect("/dashboard/researcher");
  }

  const lensParam = resolvedSearchParams.lens;
  const lens =
    (Array.isArray(lensParam) ? lensParam[0] : lensParam) || "national";

  const billsPromise = fetchBillsFromSupabase();
  const feedPromise = getIntelligenceFeed(user);

  let municipalPromise: Promise<any[]> = Promise.resolve([]);
  if (view === "kuntavahti" || lens !== "national") {
    const muniName =
      lens !== "national"
        ? lens.charAt(0).toUpperCase() + lens.slice(1)
        : "Espoo";
    municipalPromise = fetchMunicipalDecisions(muniName);
  }

  const [initialBills, initialMunicipalTasks, feedItems, cachedPulse] =
    await Promise.all([
      billsPromise,
      municipalPromise,
      feedPromise,
      getCachedCitizenPulseSummary(),
    ]);

  const showFeed = isFeatureEnabled("INTELLIGENCE_FEED_ENABLED");

  return (
    <div className="min-h-screen bg-nordic-white">
      <Navbar user={user} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 transition-all duration-500 space-y-10 md:space-y-12 feed-news-theme">
        {showFeed ? (
          <>
            <Suspense fallback={<IntelligenceFeedSkeleton />}>
              <CitizenPulseSection
                cachedPulse={cachedPulse}
                feedItemCount={feedItems.length}
              />
            </Suspense>
            <Suspense fallback={<IntelligenceFeedSkeleton />}>
              <IntelligenceFeedWrapper
                initialItems={feedItems}
                userDna={user}
                variant="citizen"
              />
            </Suspense>
          </>
        ) : null}

        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
              <p className="text-slate-400 font-black uppercase tracking-widest text-xs animate-pulse">
                Ladataan työpöytää...
              </p>
            </div>
          }
        >
          <DashboardClient
            initialUser={user}
            prefetchedBills={initialBills}
            prefetchedMunicipalTasks={initialMunicipalTasks}
            prefetchedStats={null}
            pageVariant="dashboard"
          />
        </Suspense>
      </main>
    </div>
  );
}
