import { getUser } from "@/app/actions/auth";
import Navbar from "@/components/Navbar";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { isResearcherWorkbenchEnabled } from "@/lib/config/features";
import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { loadLobbyConnectionGraph } from "@/lib/lobby/connection-graph-server";
import ResearcherWorkbench from "@/components/researcher/workbench/ResearcherWorkbench";

export const revalidate = 900;

export default async function ResearcherDashboardPage() {
  if (!isResearcherWorkbenchEnabled()) {
    notFound();
  }

  const user = await getUser();
  if (!user?.id) {
    redirect("/login?redirect=/dashboard/researcher");
  }

  const admin = await createAdminClient();

  const [lobbyGraph, pi, li, mv, rhetoricRes] = await Promise.all([
    loadLobbyConnectionGraph(admin),
    admin.from("person_interests").select("*", { count: "exact", head: true }),
    admin
      .from("lobbyist_interventions")
      .select("*", { count: "exact", head: true }),
    admin.from("mp_votes").select("*", { count: "exact", head: true }),
    admin
      .from("mp_ai_profiles")
      .select("mp_id, rhetoric_style")
      .not("rhetoric_style", "is", null)
      .limit(24),
  ]);

  const ctx = {
    lobbyGraph,
    ingestion: {
      personInterests: pi.count ?? 0,
      lobbyInterventions: li.count ?? 0,
      mpVotes: mv.count ?? 0,
    },
    rhetoricPreview: (rhetoricRes.data || []).map(
      (r: { mp_id: string | number; rhetoric_style: string | null }) => ({
        mp_id: String(r.mp_id),
        rhetoric_style: r.rhetoric_style,
      }),
    ),
  };

  return (
    <div className="min-h-screen bg-nordic-white">
      <Navbar user={user} />
      <main className="mx-auto max-w-[1600px] px-4 py-10 transition-all duration-500 sm:px-6 lg:px-8">
        <header className="mb-8 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
            Eduskuntavahti · Omatase
          </p>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
            Tutkijatyöpöytä
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
            Akateeminen työtila: korrelaatioanalyysi, verkostokartta, DNA- ja
            retoriikkaprofiilit sekä strukturoitu aineiston vienti. Ominaisuus
            on käytettävissä vain, kun järjestelmänvalvoja on aktivoinut
            tutkija-moodin (NEXT_PUBLIC_RESEARCHER_MODE).
          </p>
        </header>
        <Suspense
          fallback={
            <div className="flex min-h-[40vh] flex-col items-center justify-center space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Ladataan työpöytää…
              </p>
            </div>
          }
        >
          <ResearcherWorkbench user={user} ctx={ctx} />
        </Suspense>
      </main>
    </div>
  );
}
