import type { SupabaseClient } from "@supabase/supabase-js";

export type BulletinFeedSyncResult = {
  decisionsUpserted: number;
  lobbyistTracesUpserted: number;
  municipalDecisionsUpserted: number;
  errors: string[];
};

function clampImpact(n: number): number {
  return Math.max(5, Math.min(95, Math.round(n)));
}

function impactFromCost(cost: unknown): number {
  if (cost == null || cost === "") return 42;
  const n = Number(cost);
  if (!Number.isFinite(n) || n <= 0) return 42;
  return clampImpact(25 + Math.log10(n + 1) * 12);
}

/**
 * Fill public.decisions from public.bills (national bulletin feed).
 */
export async function syncDecisionsFromBills(
  client: SupabaseClient,
  limit = 45,
): Promise<number> {
  const { data: bills, error } = await client
    .from("bills")
    .select("id, title, summary, parliament_id, published_date")
    .order("published_date", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    console.warn("[bulletin-sync] bills:", error.message);
    return 0;
  }
  if (!bills?.length) return 0;

  let n = 0;
  const updated = new Date().toISOString();

  for (const bill of bills) {
    const external_ref = bill.parliament_id?.trim()
      ? `he:${bill.parliament_id.trim()}`
      : `bill:${bill.id}`;
    const summary = (bill.summary || "").slice(0, 6000);
    const title = (bill.title || "Ei otsikkoa").slice(0, 500);
    const impact_score = clampImpact(
      28 + (title.length % 40) + Math.min(20, Math.floor(summary.length / 400)),
    );
    const created_at = bill.published_date || updated;

    const { error: upErr } = await client.from("decisions").upsert(
      {
        external_ref,
        title,
        summary: summary || null,
        impact_score,
        source_type: "bill_sync",
        created_at,
        updated_at: updated,
      },
      { onConflict: "external_ref" },
    );

    if (!upErr) n += 1;
    else console.warn("[bulletin-sync] decision upsert:", upErr.message);
  }

  return n;
}

/**
 * Denormalize lobbyist_interventions (+ legislative_projects) → lobbyist_traces for the weekly generator.
 */
export async function syncLobbyistTracesFromInterventions(
  client: SupabaseClient,
  limit = 40,
): Promise<number> {
  const { data: rows, error } = await client
    .from("lobbyist_interventions")
    .select(
      "id, organization_name, summary_json, sentiment_score, source_url, created_at, legislative_project_id",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (/does not exist|Could not find/i.test(error.message)) {
      console.warn(
        "[bulletin-sync] lobbyist_interventions skip:",
        error.message,
      );
      return 0;
    }
    console.warn("[bulletin-sync] lobbyist_interventions:", error.message);
    return 0;
  }
  if (!rows?.length) return 0;

  const lpIds = [
    ...new Set(
      rows
        .map((r) => r.legislative_project_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ];

  const billByLp = new Map<string, string | null>();
  if (lpIds.length > 0) {
    const { data: lps, error: lpErr } = await client
      .from("legislative_projects")
      .select("id, bill_id")
      .in("id", lpIds);

    if (lpErr && !/does not exist|Could not find/i.test(lpErr.message)) {
      console.warn("[bulletin-sync] legislative_projects:", lpErr.message);
    } else {
      for (const lp of lps ?? []) {
        billByLp.set(lp.id, lp.bill_id ?? null);
      }
    }
  }

  let n = 0;
  for (const row of rows as Array<{
    id: string;
    organization_name: string;
    summary_json: Record<string, unknown> | null;
    sentiment_score: number | null;
    source_url: string | null;
    created_at: string;
    legislative_project_id: string;
  }>) {
    const sj = row.summary_json;
    let analysis =
      typeof sj?.plainLanguageSummary === "string"
        ? sj.plainLanguageSummary
        : "";
    if (!analysis && sj && typeof sj === "object") {
      analysis = JSON.stringify(sj).slice(0, 3000);
    }
    const s = row.sentiment_score != null ? Number(row.sentiment_score) : 0;
    const similarity_score = Math.max(
      0,
      Math.min(100, Math.round(((s + 1) / 2) * 100)),
    );
    const impact_score = clampImpact(Math.abs(s) * 85 + 10);
    const bill_id = billByLp.get(row.legislative_project_id) ?? null;

    const { error: upErr } = await client.from("lobbyist_traces").upsert(
      {
        source_intervention_id: row.id,
        organization_name: row.organization_name || "Organisaatio",
        analysis_summary: analysis.slice(0, 4000) || null,
        similarity_score,
        impact_score,
        bill_id,
        legislative_project_id: row.legislative_project_id,
        source_url: row.source_url,
        created_at: row.created_at,
      },
      { onConflict: "source_intervention_id" },
    );

    if (!upErr) n += 1;
    else console.warn("[bulletin-sync] lobbyist_traces upsert:", upErr.message);
  }

  return n;
}

/**
 * Copy municipal_cases (Espoo) → municipal_decisions (feeds espoo_decisions view + Espoo lobby scan).
 */
export async function syncEspooDecisionsFromMunicipalCases(
  client: SupabaseClient,
  limit = 100,
): Promise<number> {
  const { data: cases, error } = await client
    .from("municipal_cases")
    .select(
      "municipality, external_id, title, summary, category, neighborhood, cost_estimate, url, meeting_date, created_at",
    )
    .ilike("municipality", "Espoo")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (/does not exist|Could not find/i.test(error.message)) {
      console.warn("[bulletin-sync] municipal_cases skip:", error.message);
      return 0;
    }
    console.warn("[bulletin-sync] municipal_cases:", error.message);
    return 0;
  }
  if (!cases?.length) return 0;

  let n = 0;
  const updated = new Date().toISOString();

  for (const c of cases) {
    const { error: upErr } = await client.from("municipal_decisions").upsert(
      {
        municipality: c.municipality,
        external_id: c.external_id,
        title: c.title,
        summary: c.summary,
        category: c.category,
        neighborhood: c.neighborhood,
        impact_score: impactFromCost(c.cost_estimate),
        url: c.url,
        decision_date: c.meeting_date,
        created_at: c.created_at,
        updated_at: updated,
      },
      { onConflict: "municipality,external_id" },
    );

    if (!upErr) n += 1;
    else
      console.warn(
        "[bulletin-sync] municipal_decisions upsert:",
        upErr.message,
      );
  }

  return n;
}

/**
 * Run all sync steps that apply to your database (skips missing tables gracefully).
 */
export async function syncBulletinFeedTables(
  client: SupabaseClient,
): Promise<BulletinFeedSyncResult> {
  const errors: string[] = [];
  let decisionsUpserted = 0;
  let lobbyistTracesUpserted = 0;
  let municipalDecisionsUpserted = 0;

  try {
    decisionsUpserted = await syncDecisionsFromBills(client);
  } catch (e: unknown) {
    errors.push(`decisions: ${e instanceof Error ? e.message : String(e)}`);
  }

  try {
    lobbyistTracesUpserted = await syncLobbyistTracesFromInterventions(client);
  } catch (e: unknown) {
    errors.push(
      `lobbyist_traces: ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  try {
    municipalDecisionsUpserted =
      await syncEspooDecisionsFromMunicipalCases(client);
  } catch (e: unknown) {
    errors.push(
      `municipal_decisions: ${e instanceof Error ? e.message : String(e)}`,
    );
  }

  return {
    decisionsUpserted,
    lobbyistTracesUpserted,
    municipalDecisionsUpserted,
    errors,
  };
}
