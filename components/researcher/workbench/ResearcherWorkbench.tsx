"use client";

import { useState, useMemo } from "react";
import {
  FlaskConical,
  Download,
  Share2,
  Activity,
  Radar,
  BarChart3,
} from "lucide-react";

import type { UserProfile } from "@/lib/types";
import type {
  ResearcherLensDefinition,
  ResearcherLensId,
  ResearcherWorkbenchContext,
} from "./types";
import DataIngestionBanner from "./DataIngestionBanner";
import LensExportHub from "@/components/researcher/lenses/LensExportHub";
import LensLobbyNetwork from "@/components/researcher/lenses/LensLobbyNetwork";
import LensDnaRhetoric from "@/components/researcher/lenses/LensDnaRhetoric";
import LensCorrelation from "@/components/researcher/lenses/LensCorrelation";
import LensIntegratedModules from "@/components/researcher/lenses/LensIntegratedModules";
import LensChartGallery from "@/components/researcher/lenses/LensChartGallery";

const ICONS: Record<ResearcherLensDefinition["icon"], typeof FlaskConical> = {
  flask: FlaskConical,
  download: Download,
  share: Share2,
  activity: Activity,
  radar: Radar,
  gallery: BarChart3,
};

function buildLenses(
  ctx: ResearcherWorkbenchContext,
  user: UserProfile | null,
): ResearcherLensDefinition[] {
  return [
    {
      id: "export_hub",
      labelFi: "Aineiston vienti",
      descriptionFi: "CSV/JSON, rajaukset, AI Insight",
      icon: "download",
      render: () => <LensExportHub />,
    },
    {
      id: "lobby_network",
      labelFi: "Lobbariverkosto",
      descriptionFi: "Verkostokartta (tuotanto)",
      icon: "share",
      render: () => <LensLobbyNetwork ctx={ctx} />,
    },
    {
      id: "dna_rhetoric",
      labelFi: "DNA ja retoriikka",
      descriptionFi: "Radari ja tekstiprofiilit",
      icon: "radar",
      render: () => <LensDnaRhetoric ctx={ctx} />,
    },
    {
      id: "correlation",
      labelFi: "Korrelaatioanalyysi",
      descriptionFi: "Talous–arvot-taso",
      icon: "activity",
      render: () => <LensCorrelation />,
    },
    {
      id: "chart_gallery",
      labelFi: "Visualisointikirjasto",
      descriptionFi: "Kaaviomallit",
      icon: "gallery",
      render: () => <LensChartGallery ctx={ctx} />,
    },
    {
      id: "integrated_modules",
      labelFi: "Tutkijan laboratorio",
      descriptionFi: "Aikajanat, scorecard, muistiinpanot",
      icon: "flask",
      render: () => <LensIntegratedModules user={user} />,
    },
  ];
}

export default function ResearcherWorkbench({
  user,
  ctx,
}: {
  user: UserProfile | null;
  ctx: ResearcherWorkbenchContext;
}) {
  const lenses = useMemo(() => buildLenses(ctx, user), [ctx, user]);
  const [activeId, setActiveId] = useState<ResearcherLensId>("export_hub");

  const active = lenses.find((l) => l.id === activeId) ?? lenses[0];
  const Flask = ICONS.flask;

  return (
    <div className="flex min-h-[70vh] flex-col gap-6 lg:flex-row">
      <aside className="w-full shrink-0 lg:w-72">
        <div className="sticky top-4 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white">
              <Flask className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Tutkijatyöpöytä
              </p>
              <p className="text-sm font-bold text-slate-900">Workbench</p>
            </div>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-600">
            Linssiarkkitehtuuri: lisää uusi komponentti ja rekisteröi se{" "}
            <code className="rounded bg-slate-100 px-1 font-mono text-[10px]">
              buildLenses
            </code>
            -funktioon.
          </p>
          <nav className="flex flex-col gap-1">
            {lenses.map((lens) => {
              const Icon = ICONS[lens.icon];
              const on = lens.id === activeId;
              return (
                <button
                  key={lens.id}
                  type="button"
                  onClick={() => setActiveId(lens.id)}
                  className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                    on
                      ? "bg-violet-600 text-white shadow-md"
                      : "bg-slate-50 text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  <Icon
                    className={`mt-0.5 h-4 w-4 shrink-0 ${on ? "text-white" : "text-slate-500"}`}
                    aria-hidden
                  />
                  <span>
                    <span className="block text-sm font-semibold">
                      {lens.labelFi}
                    </span>
                    <span
                      className={`mt-0.5 block text-[10px] leading-snug ${
                        on ? "text-violet-100" : "text-slate-500"
                      }`}
                    >
                      {lens.descriptionFi}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      <section className="min-h-[60vh] min-w-0 flex-1 space-y-4">
        <DataIngestionBanner ingestion={ctx.ingestion} />
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {active.render(ctx)}
        </div>
      </section>
    </div>
  );
}
