"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2, FileWarning } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { StanceMatrix } from "@/components/lobby/StanceMatrix";
import { getLobbyInfluenceDrawerData } from "@/app/actions/lobby-influence-drawer";
import type { LobbyInterventionRow } from "@/lib/lobby/types";

function sourceLabel(sourceType: string): string {
  if (sourceType === "lausunto") return "Lausuntopalvelu";
  if (sourceType === "avoimuus") return "Avoimuusrekisteri";
  return sourceType;
}

export function LobbyInfluenceDrawer({
  billId,
  open,
  onOpenChange,
  headline,
}: {
  billId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  headline?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Awaited<
    ReturnType<typeof getLobbyInfluenceDrawerData>
  > | null>(null);

  useEffect(() => {
    if (!open || !billId) return;
    let cancelled = false;
    setLoading(true);
    setData(null);
    getLobbyInfluenceDrawerData(billId)
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, billId]);

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Vaikuttajajäljitettävyys"
      description={
        headline
          ? headline
          : "Lausunnot ja avoimuuslähteet — argumentit ryhmiteltynä."
      }
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-neutral-500">
          <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
          <p className="text-xs">Ladataan aineistoa…</p>
        </div>
      ) : !data ? (
        <p className="text-xs text-neutral-500">Ei näytettävää.</p>
      ) : (
        <div className="space-y-5">
          {data.pdfDiscrepancies.length > 0 ? (
            <div
              role="status"
              className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-950"
            >
              <div className="flex items-start gap-2">
                <FileWarning className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
                <div>
                  <p className="font-semibold">PDF-metatarkistus: ristiriita</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-amber-900/90">
                    Osa ladatuista PDF-tiedostoista sisältää tekijätietoja,
                    jotka eivät vastaa ilmoitettua järjestöä. Tämä on tekninen
                    signaali, ei näyttö väärinkäytöksestä.
                  </p>
                  <ul className="mt-2 space-y-1 text-[11px] text-amber-950/90">
                    {data.pdfDiscrepancies.slice(0, 5).map((m) => (
                      <li key={m.lobbyist_intervention_id + m.pdf_url}>
                        <span className="font-medium">
                          {m.expected_organization ?? "Järjestö"}
                        </span>
                        : Author/Creator{" "}
                        <span className="font-mono">
                          {m.author_field || m.creator_field || "—"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : null}

          <StanceMatrix
            proLead={data.proLead}
            conLead={data.conLead}
            proArguments={data.proArguments}
            conArguments={data.conArguments}
          />

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
              Organisaatiot ja viralliset linkit
            </p>
            <ul className="mt-2 space-y-2">
              {data.interventions.length === 0 ? (
                <li className="text-xs text-neutral-500">
                  Ei tallennettuja lausuntoja tälle hankkeelle.
                </li>
              ) : (
                data.interventions.map((row: LobbyInterventionRow) => (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-neutral-100 bg-neutral-50/80 px-2.5 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-neutral-900">
                        {row.organization_name}
                      </p>
                      <p className="text-[11px] text-neutral-500">
                        {row.category || sourceLabel(row.source_type)}
                        {row.sentiment_score != null
                          ? ` · ${row.sentiment_score.toFixed(2)}`
                          : ""}
                      </p>
                    </div>
                    {row.source_url ? (
                      <a
                        href={row.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-neutral-800 underline decoration-neutral-300 underline-offset-2 hover:decoration-neutral-900"
                      >
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        {sourceLabel(row.source_type)}
                      </a>
                    ) : null}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}
    </Sheet>
  );
}
