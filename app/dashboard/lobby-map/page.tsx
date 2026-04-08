import Navbar from "@/components/Navbar";
import LobbyConnectionMap from "@/components/dashboard/lobby/LobbyConnectionMap";
import { getUser } from "@/app/actions/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { loadLobbyConnectionGraph } from "@/lib/lobby/connection-graph-server";
import Link from "next/link";
import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lobbyist Connection Map | Omatase",
  description:
    "Mahdolliset sidonnaisuus- ja vaikutusyhteydet: Avoimuusrekisteri, sidonnaisuudet, lausunnot, valiokunta-asiantuntijat.",
};

export default async function LobbyMapPage() {
  const user = await getUser();
  const admin = await createAdminClient();
  const graph = await loadLobbyConnectionGraph(admin);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar user={user} />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 xl:max-w-[1400px]">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link
              href="/dashboard/bulletin"
              className="mb-2 inline-block text-xs font-medium text-slate-500 hover:text-[var(--accent-primary)]"
            >
              ← Viikkobulletiini
            </Link>
            <h1
              className={`${playfair.className} text-2xl font-bold text-white sm:text-3xl`}
            >
              Lobbyist Connection Map
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Visualisointi yhdistää vain virallisia ja palveluun tallennettuja
              lähteitä. Yhteydet kuvaavat mahdollisia sidonnaisuuksia
              (”Mahdollinen eturistiriita”), ei vahvistettua väärinkäytöstä.
            </p>
          </div>
        </div>
        <LobbyConnectionMap data={graph} />
      </div>
    </div>
  );
}
