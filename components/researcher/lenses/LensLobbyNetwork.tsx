"use client";

import { Share2 } from "lucide-react";

import LobbyConnectionMap from "@/components/dashboard/lobby/LobbyConnectionMap";
import type { ResearcherWorkbenchContext } from "@/components/researcher/workbench/types";

export default function LensLobbyNetwork({
  ctx,
}: {
  ctx: ResearcherWorkbenchContext;
}) {
  const hasInterests = ctx.ingestion.personInterests > 0;
  const hasMeetings =
    ctx.lobbyGraph.links.filter((l) => l.kind === "avoimuustapaaminen").length >
    0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-700">
          <Share2 className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            Lobbariverkoston kartta
          </h2>
          <p className="text-xs text-slate-600">
            Tuotantoon sovitettu verkostoanalyysi: kansanedustajat,
            organisaatiot ja dokumentoidut yhteydet useista julkisista
            lähteistä.
          </p>
        </div>
      </div>

      {!hasInterests && !hasMeetings ? (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
          Verkkoa ei voida piirtää: sidonnaisuus- ja tapaamisaineisto on vielä
          minimaalinen. Kartta aktivoituu automaattisesti
          ingestion-valmistuttua.
        </p>
      ) : (
        <LobbyConnectionMap data={ctx.lobbyGraph} />
      )}
    </div>
  );
}
