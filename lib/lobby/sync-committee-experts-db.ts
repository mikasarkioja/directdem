import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fetchRecentVaskiExpertStatements,
  type VaskiExpertRow,
} from "@/lib/lobby/committee-experts-vaski";
import { heFromFinnishDocId } from "@/lib/lobby/he-from-finnish-doc";
import { upsertExpertHearingInterventions } from "@/lib/lobby/upsert-expert-interventions";

function rowToDb(
  r: VaskiExpertRow,
  lpIdByHe: Map<string, string>,
): Record<string, unknown> {
  const he = heFromFinnishDocId(r.eduskuntaTunnus);
  const lp = he ? (lpIdByHe.get(he) ?? null) : null;
  return {
    vaski_row_id: r.vaskiRowId,
    eduskunta_tunnus: r.eduskuntaTunnus,
    committee_code: r.committeeCode,
    session_date_raw: r.sessionDateRaw,
    title_plain: r.titlePlain,
    expert_name: r.expertName,
    expert_organization: r.expertOrganization,
    expert_organization_normalized: r.expertOrganizationNormalized,
    pdf_url: r.pdfUrl,
    legislative_project_id: lp,
    he_tunnus: he,
    source_api_url:
      "https://avoindata.eduskunta.fi/api/v1/vaski/asiakirjatyyppinimi",
  };
}

/**
 * Synkkaa viimeisimmät Asiantuntijalausunto-rivit Vaskista `committee_expert_invites`-tauluun.
 */
export async function syncCommitteeExpertInvitesFromVaski(
  admin: SupabaseClient,
  options?: { maxPages?: number },
): Promise<{
  attempted: number;
  lobbyistInterventionsUpserted?: number;
  lobbyistInterventionsErrors?: string[];
  error?: string;
}> {
  const rows = await fetchRecentVaskiExpertStatements(options?.maxPages ?? 4);
  const heKeys = [
    ...new Set(
      rows
        .map((r) => heFromFinnishDocId(r.eduskuntaTunnus))
        .filter((h): h is string => !!h),
    ),
  ];
  const lpIdByHe = new Map<string, string>();
  const billByLpId = new Map<string, string | null>();
  if (heKeys.length) {
    const lpRes = await admin
      .from("legislative_projects")
      .select("id, he_tunnus, bill_id")
      .in("he_tunnus", heKeys);
    if (!lpRes.error && lpRes.data) {
      for (const x of lpRes.data as {
        id: string;
        he_tunnus: string;
        bill_id: string | null;
      }[]) {
        lpIdByHe.set(x.he_tunnus, x.id);
        billByLpId.set(x.id, x.bill_id ?? null);
      }
    }
  }

  const payload = rows.map((r) => rowToDb(r, lpIdByHe));
  if (!payload.length) return { attempted: 0 };

  const up = await admin.from("committee_expert_invites").upsert(payload, {
    onConflict: "vaski_row_id",
    ignoreDuplicates: true,
  });

  if (up.error) {
    return { attempted: 0, error: up.error.message };
  }

  const lobby = await upsertExpertHearingInterventions(
    admin,
    rows,
    lpIdByHe,
    billByLpId,
  );

  return {
    attempted: payload.length,
    lobbyistInterventionsUpserted: lobby.upserted,
    lobbyistInterventionsErrors:
      lobby.errors.length > 0 ? lobby.errors : undefined,
  };
}
