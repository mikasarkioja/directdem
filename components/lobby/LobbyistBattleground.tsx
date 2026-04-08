"use client";

import {
  Scale,
  TrendingUp,
  TrendingDown,
  Building2,
  ExternalLink,
} from "lucide-react";
import type { LobbyInterventionRow } from "@/lib/lobby/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SummaryJson = {
  plainLanguageSummary?: string;
  coreStance?: string;
  keyArguments?: string[];
  proposedChanges?: string;
};

function parseSummary(row: LobbyInterventionRow): SummaryJson {
  const j = row.summary_json;
  if (j && typeof j === "object" && !Array.isArray(j)) {
    return j as SummaryJson;
  }
  return {};
}

function bucket(row: LobbyInterventionRow): "pro" | "con" | "neutral" {
  const j = parseSummary(row);
  const stance = j.coreStance;
  const s = row.sentiment_score ?? 0;
  if (stance === "oppose" || s < -0.08) return "con";
  if (stance === "support" || s > 0.08) return "pro";
  return "neutral";
}

/**
 * Kansalaisystävällinen vierekkäisvertailu: kenkä painaa myötä / vastaan.
 */
export function LobbyistBattleground({
  interventions,
}: {
  interventions: LobbyInterventionRow[];
}) {
  if (!interventions.length) {
    return (
      <section
        aria-label="Lobbauskenttä"
        className="rounded-2xl border border-dashed border-amber-500/30 bg-amber-500/5 p-6 text-sm text-slate-400"
      >
        Ei vielä lobbauspoimintoja tälle aloitteelle. Ylläpito voi päivittää
        analyysin Lausuntopalvelu- ja Avoimuusrekisteri -lähteistä.
      </section>
    );
  }

  const pro = interventions.filter((r) => bucket(r) === "pro");
  const con = interventions.filter((r) => bucket(r) === "con");
  const neutral = interventions.filter((r) => bucket(r) === "neutral");

  const sortPro = [...pro].sort(
    (a, b) => (b.sentiment_score ?? 0) - (a.sentiment_score ?? 0),
  );
  const sortCon = [...con].sort(
    (a, b) => (a.sentiment_score ?? 0) - (b.sentiment_score ?? 0),
  );

  return (
    <section aria-label="Lobbauskenttä" className="space-y-4">
      <div className="flex items-center gap-2 text-amber-300">
        <Scale className="h-5 w-5 shrink-0" aria-hidden />
        <h3 className="text-sm font-bold tracking-tight text-white">
          Lobbauskenttä – vastakkaiset näkemykset
        </h3>
      </div>
      <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
        Vertaile organisaatioiden kantoja selkokielellä. Tiedot perustuvat
        julkisiin lausuntoihin ja avoimuusrekisterin raportointitietoihin.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
            <TrendingUp className="h-4 w-4" />
            Painetta puolesta
          </div>
          {sortPro.length ? (
            sortPro.map((row) => <OrgCard key={row.id} row={row} tone="pro" />)
          ) : (
            <p className="text-xs text-slate-500 pl-1">
              Ei selkeää myötäryhmää.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-rose-400 text-[10px] font-black uppercase tracking-widest">
            <TrendingDown className="h-4 w-4" />
            Painetta vastaan
          </div>
          {sortCon.length ? (
            sortCon.map((row) => <OrgCard key={row.id} row={row} tone="con" />)
          ) : (
            <p className="text-xs text-slate-500 pl-1">
              Ei selkeää vastaryhmää.
            </p>
          )}
        </div>
      </div>

      {neutral.length > 0 ? (
        <div className="space-y-2 pt-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Ehdollinen tai epäselvä kanta
          </p>
          <div className="grid gap-2">
            {neutral.map((row) => (
              <OrgCard key={row.id} row={row} tone="neutral" />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function OrgCard({
  row,
  tone,
}: {
  row: LobbyInterventionRow;
  tone: "pro" | "con" | "neutral";
}) {
  const j = parseSummary(row);
  const border =
    tone === "pro"
      ? "border-emerald-500/25"
      : tone === "con"
        ? "border-rose-500/25"
        : "border-slate-600/50";

  return (
    <Card className={`${border} bg-slate-950/40`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Building2
              className="h-4 w-4 shrink-0 text-slate-500"
              aria-hidden
            />
            <CardTitle className="text-base font-semibold text-white truncate">
              {row.organization_name}
            </CardTitle>
          </div>
          <span
            className={`shrink-0 text-[10px] font-bold tabular-nums ${
              tone === "pro"
                ? "text-emerald-400"
                : tone === "con"
                  ? "text-rose-400"
                  : "text-amber-400"
            }`}
          >
            {(row.sentiment_score ?? 0).toFixed(2)}
          </span>
        </div>
        {row.category ? (
          <CardDescription>{row.category}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        {j.plainLanguageSummary ? (
          <p className="leading-relaxed">{j.plainLanguageSummary}</p>
        ) : null}
        {j.keyArguments && j.keyArguments.length > 0 ? (
          <ul className="list-disc pl-4 space-y-1 text-xs text-slate-400">
            {j.keyArguments.slice(0, 3).map((a) => (
              <li key={a.slice(0, 24)}>{a}</li>
            ))}
          </ul>
        ) : null}
        {j.proposedChanges ? (
          <p className="text-xs text-amber-200/90 border-l-2 border-amber-500/40 pl-3">
            <span className="font-semibold text-amber-400/90">
              Ehdotetut muutokset:{" "}
            </span>
            {j.proposedChanges}
          </p>
        ) : null}
        {row.source_url ? (
          <a
            href={row.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-400 hover:underline"
          >
            <ExternalLink className="h-3 w-3" aria-hidden />
            Virallinen lähde (
            {row.source_type === "lausunto"
              ? "Lausuntopalvelu"
              : row.source_type === "avoimuus"
                ? "Avoimuusrekisteri"
                : row.source_type}
            )
          </a>
        ) : null}
      </CardContent>
    </Card>
  );
}
