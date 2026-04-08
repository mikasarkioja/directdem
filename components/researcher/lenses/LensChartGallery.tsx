"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { BarChart3 } from "lucide-react";

import type { ResearcherWorkbenchContext } from "@/components/researcher/workbench/types";

/** Laajennettava visualisointimalli: uudet kaaviotyypit rekisteröidään tähän linssiin. */
export default function LensChartGallery({
  ctx,
}: {
  ctx: ResearcherWorkbenchContext;
}) {
  const volumeData = [
    { nimi: "Äänestysrivit", arvo: ctx.ingestion.mpVotes },
    { nimi: "Lausunnot", arvo: ctx.ingestion.lobbyInterventions },
    { nimi: "Sidonnaisuudet", arvo: ctx.ingestion.personInterests },
  ];

  const trendData = volumeData.map((d, i) => ({
    vaihe: `S${i + 1}`,
    tiheys: Math.max(1, Math.round(Math.log10(d.arvo + 10) * 20)),
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-800">
          <BarChart3 className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            Visualisointikirjasto
          </h2>
          <p className="text-xs text-slate-600">
            Perusmallit (Recharts). Verkostoanalyysi on erillisessä linssissä
            (react-force-graph).
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-700">
            Aineistovaranto (lukumäärät)
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="nimi" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="arvo" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-700">
            Logaritminen tiheys (mallipohja)
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="vaihe" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="tiheys"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Esim. aikasarjoja varten korvaa{" "}
            <code className="font-mono">trendData</code> omalla aggregaatillasi.
          </p>
        </div>
      </div>
    </div>
  );
}
