"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getUser } from "@/app/actions/auth";
import { isResearcherWorkbenchEnabled } from "@/lib/config/features";
import { generateExportDatasetInsight } from "@/lib/researcher/export-insight-gemini";

export type ResearcherDatasetKey =
  | "mp_votes"
  | "lobbyist_interventions"
  | "person_interests";

export type ExportHubFilters = {
  dateFrom?: string;
  dateTo?: string;
  party?: string;
  legislativeProjectId?: string;
};

const DATASET_LABELS: Record<ResearcherDatasetKey, string> = {
  mp_votes: "Kansanedustajien äänestykset",
  lobbyist_interventions: "Lobbyistien lausunnot ja kannanotot",
  person_interests: "Sidonnaisuusrekisteri (ilmoitetut sidonnaisuudet)",
};

const MAX_ROWS = 8_000;

function assertWorkbenchAccess() {
  if (!isResearcherWorkbenchEnabled()) {
    throw new Error("Tutkijatyöpöytä ei ole käytössä.");
  }
}

async function assertAuthenticated() {
  const user = await getUser();
  if (!user?.id) {
    throw new Error("Kirjautuminen vaaditaan.");
  }
  return user;
}

/** Yhdistetty rivihaku: käytä vientiin ja esikatseluun */
export async function fetchResearcherExportRows(
  dataset: ResearcherDatasetKey,
  filters: ExportHubFilters,
): Promise<Record<string, unknown>[]> {
  assertWorkbenchAccess();
  await assertAuthenticated();
  const supabase = await createClient();

  if (dataset === "mp_votes") {
    let eventQuery = supabase
      .from("voting_events")
      .select("id")
      .order("voting_date", { ascending: false })
      .limit(5_000);

    if (filters.dateFrom) {
      eventQuery = eventQuery.gte("voting_date", filters.dateFrom);
    }
    if (filters.dateTo) {
      eventQuery = eventQuery.lte("voting_date", filters.dateTo);
    }

    const { data: events, error: evErr } = await eventQuery;
    if (evErr) throw evErr;
    const eventIds = (events || []).map((e) => e.id).filter(Boolean);
    if (eventIds.length === 0) return [];

    const { data: rawVotes, error } = await supabase
      .from("mp_votes")
      .select(
        `
        id,
        mp_id,
        event_id,
        vote_type,
        created_at,
        mps ( first_name, last_name, party ),
        voting_events ( title_fi, voting_date, he_id )
      `,
      )
      .in("event_id", eventIds.slice(0, 3_000))
      .limit(MAX_ROWS);

    if (error) throw error;

    let votes = rawVotes || [];
    if (filters.party?.trim()) {
      const p = filters.party.trim();
      votes = votes.filter(
        (row) => (row.mps as { party?: string } | null)?.party === p,
      );
    }

    return votes.map((row) => ({
      mp_vote_id: row.id,
      mp_id: row.mp_id,
      mp_name: row.mps
        ? `${(row.mps as { first_name?: string }).first_name ?? ""} ${(row.mps as { last_name?: string }).last_name ?? ""}`.trim()
        : "",
      party: (row.mps as { party?: string } | null)?.party ?? "",
      event_id: row.event_id,
      vote_type: row.vote_type,
      vote_title_fi:
        (row.voting_events as { title_fi?: string } | null)?.title_fi ?? "",
      voting_date:
        (row.voting_events as { voting_date?: string } | null)?.voting_date ??
        "",
      he_id: (row.voting_events as { he_id?: string } | null)?.he_id ?? "",
      row_created_at: row.created_at,
    }));
  }

  if (dataset === "lobbyist_interventions") {
    let q = supabase
      .from("lobbyist_interventions")
      .select(
        `
        id,
        legislative_project_id,
        organization_name,
        category,
        summary_json,
        sentiment_score,
        source_url,
        source_type,
        raw_excerpt,
        created_at,
        legislative_projects ( he_tunnus, title )
      `,
      )
      .order("created_at", { ascending: false })
      .limit(MAX_ROWS);

    if (filters.dateFrom) q = q.gte("created_at", filters.dateFrom);
    if (filters.dateTo) q = q.lte("created_at", filters.dateTo);
    if (filters.legislativeProjectId?.trim()) {
      q = q.eq("legislative_project_id", filters.legislativeProjectId.trim());
    }

    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map((row) => ({
      id: row.id,
      legislative_project_id: row.legislative_project_id,
      he_tunnus:
        (row.legislative_projects as { he_tunnus?: string } | null)
          ?.he_tunnus ?? "",
      project_title:
        (row.legislative_projects as { title?: string } | null)?.title ?? "",
      organization_name: row.organization_name,
      category: row.category,
      summary_json: row.summary_json,
      sentiment_score: row.sentiment_score,
      source_url: row.source_url,
      source_type: row.source_type,
      raw_excerpt: row.raw_excerpt,
      created_at: row.created_at,
    }));
  }

  // person_interests
  let q = supabase
    .from("person_interests")
    .select(
      `
      id,
      subject_type,
      mp_id,
      person_display_name,
      interest_organization,
      role_or_relation,
      declaration_url,
      declaration_date,
      source_register_label,
      created_at
    `,
    )
    .order("created_at", { ascending: false })
    .limit(MAX_ROWS);

  if (filters.dateFrom) {
    q = q.gte("declaration_date", filters.dateFrom);
  }
  if (filters.dateTo) {
    q = q.lte("declaration_date", filters.dateTo);
  }

  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function logResearcherExportEvent(input: {
  dataset: ResearcherDatasetKey;
  format: "csv" | "json";
  rowCount: number;
  filters: ExportHubFilters;
  aiInsightRequested: boolean;
}) {
  assertWorkbenchAccess();
  const user = await assertAuthenticated();
  const admin = await createAdminClient();
  const { error } = await admin.from("researcher_export_logs").insert({
    user_id: user.id,
    dataset_key: input.dataset,
    export_format: input.format,
    row_count: input.rowCount,
    filters: input.filters as Record<string, unknown>,
    ai_insight_requested: input.aiInsightRequested,
  });
  if (error) {
    console.error("[researcher_export_logs]", error.message);
  }
}

export async function getResearcherExportAiInsight(
  dataset: ResearcherDatasetKey,
  filters: ExportHubFilters,
) {
  assertWorkbenchAccess();
  await assertAuthenticated();
  const rows = await fetchResearcherExportRows(dataset, filters);
  const sample = rows
    .slice(0, 40)
    .map((r) =>
      Object.fromEntries(
        Object.entries(r).filter(
          ([k]) => k !== "raw_excerpt" && k !== "summary_json",
        ),
      ),
    );
  const insight = await generateExportDatasetInsight({
    datasetLabelFi: DATASET_LABELS[dataset],
    rowCount: rows.length,
    sampleRows: sample.length
      ? sample
      : [{ huom: "Ei rivejä valituilla rajauksilla" }],
  });
  return { insight, rowCount: rows.length };
}
