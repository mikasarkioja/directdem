"use server";

import { createClient } from "@/lib/supabase/server";
import { getLobbyistInterventionsForBill } from "@/app/actions/lobbyist-traceability";
import type { LobbyInterventionRow } from "@/lib/lobby/types";
import { synthesizeStanceMatrixLeads } from "@/lib/lobby/stance-matrix-gemini";

type SummaryJson = {
  coreStance?: string;
  keyArguments?: string[];
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

export type LobbyPdfDiscrepancy = {
  lobbyist_intervention_id: string;
  pdf_url: string;
  author_field: string | null;
  creator_field: string | null;
  expected_organization: string | null;
  author_mismatch: boolean;
};

export type LobbyInfluenceDrawerPayload = {
  interventions: LobbyInterventionRow[];
  proArguments: string[];
  conArguments: string[];
  proLead: string | null;
  conLead: string | null;
  pdfDiscrepancies: LobbyPdfDiscrepancy[];
};

/**
 * Vaikuttajalaatikosto: lausunnot, jako puolesta/vastaan, Gemini-tiivistelmä, PDF-metavaroitukset.
 */
export async function getLobbyInfluenceDrawerData(
  billId: string,
): Promise<LobbyInfluenceDrawerPayload> {
  const rows = await getLobbyistInterventionsForBill(billId);

  const proArgs: string[] = [];
  const conArgs: string[] = [];

  for (const row of rows) {
    const j = parseSummary(row);
    const args = (j.keyArguments || []).filter(
      (a): a is string => typeof a === "string" && a.trim().length > 0,
    );
    const b = bucket(row);
    if (b === "pro") proArgs.push(...args);
    else if (b === "con") conArgs.push(...args);
  }

  const uniq = (xs: string[]) => [...new Set(xs)].slice(0, 14);

  let proLead: string | null = null;
  let conLead: string | null = null;

  const supabase = await createClient();
  const { data: bill } = await supabase
    .from("bills")
    .select("title")
    .eq("id", billId)
    .maybeSingle();
  const billTitle = bill?.title || "Lakiesitys";

  const uPro = uniq(proArgs);
  const uCon = uniq(conArgs);
  const gemini = await synthesizeStanceMatrixLeads({
    billTitle,
    proArgs: uPro,
    conArgs: uCon,
  });
  if (gemini) {
    proLead = gemini.proLead;
    conLead = gemini.conLead;
  } else if (uPro.length || uCon.length) {
    proLead =
      uPro.slice(0, 3).join(" · ") ||
      "Puoltavia perusteluja ei erotettu aineistosta.";
    conLead =
      uCon.slice(0, 3).join(" · ") ||
      "Vastustavia perusteluja ei erotettu aineistosta.";
  }

  const ids = rows.map((r) => r.id);
  let pdfDiscrepancies: LobbyPdfDiscrepancy[] = [];
  if (ids.length) {
    const { data: meta, error: metaErr } = await supabase
      .from("lobby_statement_document_metadata")
      .select(
        "lobbyist_intervention_id, pdf_url, author_field, creator_field, expected_organization, author_mismatch",
      )
      .in("lobbyist_intervention_id", ids)
      .eq("author_mismatch", true);

    if (metaErr) {
      console.warn("[getLobbyInfluenceDrawerData] pdf meta:", metaErr.message);
    } else {
      pdfDiscrepancies = (meta as LobbyPdfDiscrepancy[]) ?? [];
    }
  }

  return {
    interventions: rows,
    proArguments: uniq(proArgs),
    conArguments: uniq(conArgs),
    proLead,
    conLead,
    pdfDiscrepancies,
  };
}
