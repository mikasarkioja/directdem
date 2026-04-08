"use client";

import { useMemo, useState, useCallback } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  createColumnHelper,
} from "@tanstack/react-table";
import Papa from "papaparse";
import { Download, Loader2, Sparkles, Table as TableIcon } from "lucide-react";

import {
  fetchResearcherExportRows,
  logResearcherExportEvent,
  getResearcherExportAiInsight,
  type ResearcherDatasetKey,
  type ExportHubFilters,
} from "@/app/actions/researcher-export-hub";

const DATASETS: { key: ResearcherDatasetKey; label: string }[] = [
  { key: "mp_votes", label: "Kansanedustajien äänestykset" },
  { key: "lobbyist_interventions", label: "Lobbyistien lausunnot" },
  { key: "person_interests", label: "Sidonnaisuusrekisteri" },
];

function flattenCell(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export default function LensExportHub() {
  const [dataset, setDataset] = useState<ResearcherDatasetKey>("mp_votes");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [party, setParty] = useState("");
  const [projectId, setProjectId] = useState("");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insight, setInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);

  const filters: ExportHubFilters = useMemo(
    () => ({
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      party: party || undefined,
      legislativeProjectId: projectId || undefined,
    }),
    [dateFrom, dateTo, party, projectId],
  );

  const loadPreview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchResearcherExportRows(dataset, filters);
      setRows(data);
      setInsight(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Lataus epäonnistui");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [dataset, filters]);

  const columns = useMemo(() => {
    if (!rows.length) return [];
    const keys = Object.keys(rows[0]);
    const helper = createColumnHelper<Record<string, unknown>>();
    return keys.map((key) =>
      helper.accessor((row) => row[key], {
        id: key,
        header: key,
        cell: (info) => (
          <span className="max-w-[240px] truncate font-mono text-[11px]">
            {flattenCell(info.getValue())}
          </span>
        ),
      }),
    );
  }, [rows]);

  const table = useReactTable({
    data: rows,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const download = async (format: "csv" | "json") => {
    const data = rows.length
      ? rows
      : await fetchResearcherExportRows(dataset, filters);
    let blob: Blob;
    if (format === "json") {
      blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
    } else {
      const csv = Papa.unparse(data as Record<string, unknown>[]);
      blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    }
    const filename =
      format === "csv"
        ? `eduskuntavahti-${dataset}.csv`
        : `eduskuntavahti-${dataset}.json`;
    await logResearcherExportEvent({
      dataset,
      format,
      rowCount: data.length,
      filters,
      aiInsightRequested: Boolean(insight),
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const runInsight = async () => {
    setInsightLoading(true);
    setError(null);
    try {
      const { insight: text } = await getResearcherExportAiInsight(
        dataset,
        filters,
      );
      setInsight(text);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "AI-yhteenveto epäonnistui");
    } finally {
      setInsightLoading(false);
    }
  };

  const showProjectFilter = dataset === "lobbyist_interventions";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-800">
          <Download className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            Aineiston vienti (Export Hub)
          </h2>
          <p className="text-xs text-slate-600">
            Rajaa aineisto, esikatsele taulukossa ja vie CSV tai JSON.
            Valinnainen tekoälyanalyysi korostaa mahdollisia poikkeamia ennen
            vientiä.
          </p>
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 md:grid-cols-2 lg:grid-cols-3">
        <label className="space-y-1 text-xs font-semibold text-slate-700">
          Aineisto
          <select
            value={dataset}
            onChange={(e) => setDataset(e.target.value as ResearcherDatasetKey)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            {DATASETS.map((d) => (
              <option key={d.key} value={d.key}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs font-semibold text-slate-700">
          Alkupäivä (ISO)
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="space-y-1 text-xs font-semibold text-slate-700">
          Loppupäivä (ISO)
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          />
        </label>
        {dataset === "mp_votes" && (
          <label className="space-y-1 text-xs font-semibold text-slate-700">
            Puolue (lyhenne, esim. KOK)
            <input
              value={party}
              onChange={(e) => setParty(e.target.value)}
              placeholder="KOK"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </label>
        )}
        {showProjectFilter && (
          <label className="space-y-1 text-xs font-semibold text-slate-700">
            Lakihankkeen UUID (valinnainen)
            <input
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="legislative_project.id"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs"
            />
          </label>
        )}
      </div>

      {dataset === "person_interests" ? (
        <p className="text-xs text-slate-500">
          Sidonnaisuusrekisterissä rajaus tehdään ilmoitetun päivämäärän
          (declaration_date) perusteella.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={loadPreview}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <TableIcon className="h-4 w-4" />
          )}
          Lataa esikatselu
        </button>
        <button
          type="button"
          onClick={() => download("csv")}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
        >
          <Download className="h-4 w-4" />
          Vie CSV
        </button>
        <button
          type="button"
          onClick={() => download("json")}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
        >
          <Download className="h-4 w-4" />
          Vie JSON
        </button>
        <button
          type="button"
          onClick={runInsight}
          disabled={insightLoading}
          className="inline-flex items-center gap-2 rounded-xl border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-900"
        >
          {insightLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          AI Insight (vientiin)
        </button>
      </div>

      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      {insight ? (
        <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-4 text-sm leading-relaxed text-slate-800">
          <p className="text-xs font-bold uppercase tracking-wide text-violet-900">
            Tekoälypohjainen yhteenveto (Gemini 3 Flash)
          </p>
          <div className="prose prose-sm mt-2 max-w-none whitespace-pre-wrap">
            {insight}
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <input
          type="search"
          placeholder="Suodata rivejä (kaikki sarakkeet)…"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full max-w-md rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        />
        <div className="overflow-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="sticky top-0 z-10 bg-slate-100">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => (
                    <th
                      key={h.id}
                      className="border-b border-slate-200 px-2 py-2 font-bold text-slate-700"
                    >
                      {h.isPlaceholder
                        ? null
                        : flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length || 1}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    Ei rivejä. Valitse rajaukset ja paina &quot;Lataa
                    esikatselu&quot;.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-100 hover:bg-slate-50/80"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-2 py-1 align-top">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-slate-500">
          Esikatselussa enintään 8 000 riviä. Viennit noudattavat samoja
          rajauksia.
        </p>
      </div>
    </div>
  );
}
