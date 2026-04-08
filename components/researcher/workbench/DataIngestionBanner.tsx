"use client";

import { AlertTriangle, Database } from "lucide-react";

import type { ResearcherIngestionCounts } from "./types";

const LOW_THRESHOLD = 12;

export default function DataIngestionBanner({
  ingestion,
}: {
  ingestion: ResearcherIngestionCounts;
}) {
  const weak = [
    ingestion.personInterests < LOW_THRESHOLD ? "Sidonnaisuusrekisteri" : null,
    ingestion.lobbyInterventions < LOW_THRESHOLD
      ? "Lobbyistien lausunnot"
      : null,
    ingestion.mpVotes < LOW_THRESHOLD ? "Äänestysaineisto" : null,
  ]
    .filter(Boolean)
    .join(", ");

  if (!weak) return null;

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
      <Database
        className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"
        aria-hidden
      />
      <div className="space-y-1">
        <p className="flex items-center gap-2 font-semibold">
          <AlertTriangle className="h-4 w-4" aria-hidden />
          Aineiston täydennys käynnissä
        </p>
        <p className="text-xs leading-relaxed text-amber-900/85">
          Seuraavien lähteiden rivimäärä on vielä pieni: {weak}. Visualisoinnit
          ja viennit päivittyvät, kun taustasync on valmis. Rajaukset ja
          auditointi toimivat silti saatavilla olevan otoksen puitteissa.
        </p>
      </div>
    </div>
  );
}
