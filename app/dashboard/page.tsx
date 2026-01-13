import { getUser } from "@/app/actions/auth";
import DashboardClient from "./DashboardClient";
import Navbar from "@/components/Navbar";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { fetchBillsFromSupabase } from "@/app/actions/bills-supabase";
import { fetchMunicipalDecisions } from "@/app/actions/municipal";
import { getResearcherStats } from "@/app/actions/researcher";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const user = await getUser();
  const resolvedSearchParams = await searchParams;
  const view = (resolvedSearchParams.view as string) || "committee";
  const lens = (resolvedSearchParams.lens as string) || "national";
  
  // Esihaku: Ladataan kriittinen data jo palvelimella
  const initialDataPromises = [];
  
  // Kansalliset lakiesitykset ladataan lähes aina
  const billsPromise = fetchBillsFromSupabase();
  
  // Kunnalliset päätökset jos ollaan kuntanäkymässä tai linssi on asetettu
  let municipalPromise: Promise<any[]> = Promise.resolve([]);
  if (view === "kuntavahti" || lens !== "national") {
    const muniName = lens !== "national" ? lens.charAt(0).toUpperCase() + lens.slice(1) : "Espoo";
    municipalPromise = fetchMunicipalDecisions(muniName);
  }
  
  // Tutkijatilastot jos ollaan tutkijanäkymässä
  let statsPromise: Promise<any> = Promise.resolve(null);
  if (view === "researcher") {
    statsPromise = getResearcherStats();
  }

  const [initialBills, initialMunicipalTasks, initialStats] = await Promise.all([
    billsPromise,
    municipalPromise,
    statsPromise
  ]);

  const isResearcher = view === "researcher";

  return (
    <div className="min-h-screen bg-nordic-white">
      <Navbar user={user} />
      <main className={`${isResearcher ? 'max-w-[1600px]' : 'max-w-7xl'} mx-auto px-4 sm:px-6 lg:px-8 py-10 transition-all duration-500`}>
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs animate-pulse">
              Ladataan Digitaalista Työhuonetta...
            </p>
          </div>
        }>
          <DashboardClient 
            initialUser={user} 
            prefetchedBills={initialBills}
            prefetchedMunicipalTasks={initialMunicipalTasks}
            prefetchedStats={initialStats}
          />
        </Suspense>
      </main>
    </div>
  );
}

