"use client";

import DemocraticDNA from "@/components/DemocraticDNA";
import type { ResearcherWorkbenchContext } from "@/components/researcher/workbench/types";
import Link from "next/link";

export default function LensDnaRhetoric({
  ctx,
}: {
  ctx: ResearcherWorkbenchContext;
}) {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-lg font-bold tracking-tight text-slate-900">
          Demokraattinen DNA ja retoriikkaprofiilit
        </h2>
        <p className="text-xs leading-relaxed text-slate-600">
          DNA-visualisointi perustuu käyttäjäprofiilin toimintaan alustalla;
          edustajakohtainen retoriikka löytyy{" "}
          <Link
            href="/bills"
            className="font-semibold text-violet-700 underline"
          >
            lainsäädäntöaineistosta
          </Link>{" "}
          ja yksittäisten kansanedustajien sivuilta. Tämä linssi kokoaa
          tutkijalle nopean käyttöliittymän molempiin ulottuvuuksiin.
        </p>
      </div>

      <DemocraticDNA />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">
          Retoriikka (otos mp_ai_profiles)
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Kielellinen tyyli ja teemat: rakennettu automaattisesta
          tekstianalyysista; tulkinta on kuvaileva, ei normatiivinen.
        </p>
        <ul className="mt-4 max-h-[420px] space-y-3 overflow-y-auto text-sm">
          {ctx.rhetoricPreview.length === 0 ? (
            <li className="rounded-lg bg-slate-50 px-3 py-4 text-slate-600">
              Ei retoriikkatekstejä vielä saatavilla (taustakäsittely tai tyhjä
              taulu).
            </li>
          ) : (
            ctx.rhetoricPreview.map((row) => (
              <li
                key={row.mp_id}
                className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2"
              >
                <Link
                  href={`/dashboard/mps/${row.mp_id}`}
                  className="font-mono text-xs font-bold text-violet-800 hover:underline"
                >
                  MP {row.mp_id}
                </Link>
                <p className="mt-1 text-xs leading-relaxed text-slate-700">
                  {(row.rhetoric_style || "").slice(0, 900)}
                  {(row.rhetoric_style?.length || 0) > 900 ? "…" : ""}
                </p>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
