"use server";

import { createClient } from "@/lib/supabase/server";
import { getLobbyistInterventionsForBill } from "@/app/actions/lobbyist-traceability";
import type { LobbyInterventionRow } from "@/lib/lobby/types";
import { synthesizeStanceMatrixLeads } from "@/lib/lobby/stance-matrix-gemini";

type SummaryJson = {
  coreStance?: string;
  keyArguments?: string[];
  plainLanguageSummary?: string;
};

function parseSummary(row: LobbyInterventionRow): SummaryJson {
  const j = row.summary_json;
  if (j && typeof j === "object" && !Array.isArray(j)) {
    return j as SummaryJson;
  }
  return {};
}

/** Poimi näytettävät argumenttirimpsut (LLM-lista tai selkokielitiivistelmä / asiantuntijarivi). */
function extractArgumentLines(row: LobbyInterventionRow): string[] {
  const j = parseSummary(row);
  const fromLlm = (j.keyArguments || []).filter(
    (a): a is string => typeof a === "string" && a.trim().length > 0,
  );
  if (fromLlm.length) return fromLlm.slice(0, 4);
  const plain =
    typeof j.plainLanguageSummary === "string"
      ? j.plainLanguageSummary.trim()
      : "";
  if (plain) {
    const org = row.organization_name?.trim();
    return [`${org ? `${org}: ` : ""}${plain}`];
  }
  const raw = (row as { raw_excerpt?: string | null }).raw_excerpt;
  if (raw && typeof raw === "string" && raw.trim().length > 10) {
    const org = row.organization_name?.trim();
    return [`${org ? `${org}: ` : ""}${raw.trim().slice(0, 500)}`];
  }
  return [];
}

function bucket(row: LobbyInterventionRow): "pro" | "con" | "neutral" {
  const j = parseSummary(row);
  const stance = j.coreStance;
  const s = row.sentiment_score ?? 0;
  if (stance === "oppose" || s < -0.08) return "con";
  if (stance === "support" || s > 0.08) return "pro";
  if (stance === "conditional") return "neutral";
  if (row.source_type === "expert_hearing" || row.source_type === "statement") {
    return "neutral";
  }
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
  const neutralArgs: string[] = [];

  for (const row of rows) {
    const lines = extractArgumentLines(row);
    if (!lines.length) continue;
    const b = bucket(row);
    if (b === "pro") proArgs.push(...lines);
    else if (b === "con") conArgs.push(...lines);
    else neutralArgs.push(...lines);
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
  const uNeutral = uniq(neutralArgs);

  const gemini = await synthesizeStanceMatrixLeads({
    billTitle,
    proArgs: uPro.length || uCon.length ? uPro : uNeutral,
    conArgs: uPro.length || uCon.length ? uCon : [],
  });
  if (gemini) {
    proLead = gemini.proLead;
    conLead = gemini.conLead;
    if (!uPro.length && !uCon.length && uNeutral.length) {
      conLead =
        "Selkeitä vastustavia ryhmiä ei erotettu; alla neutraali asiantuntija-/lausuntoaineisto.";
    }
  } else if (uPro.length || uCon.length) {
    proLead =
      uPro.slice(0, 3).join(" · ") ||
      "Puoltavia perusteluja ei erotettu aineistosta.";
    conLead =
      uCon.slice(0, 3).join(" · ") ||
      "Vastustavia perusteluja ei erotettu aineistosta.";
  } else if (uNeutral.length) {
    proLead = uNeutral.slice(0, 4).join("\n\n");
    conLead =
      "Vastustavia perusteluja ei löytynyt erikseen — aineisto koostuu pääasiassa asiantuntija- ja lausuntoriveistä ilman selkeää vastakkainasettelua.";
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
    proArguments: uniq(
      uPro.length || uCon.length ? proArgs : [...proArgs, ...neutralArgs],
    ),
    conArguments: uniq(conArgs),
    proLead,
    conLead,
    pdfDiscrepancies,
  };
}
