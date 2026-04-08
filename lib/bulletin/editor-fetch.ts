import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildPotentialInterestConflicts,
  type BulletinInterestConflictHint,
  type PersonInterestRow,
} from "@/lib/bulletin/interest-crossref";

const log = (...a: unknown[]) => console.log("[BulletinEditorFetch]", ...a);

export type BulletinDecisionBrief = {
  id: string;
  title: string;
  summary: string | null;
  impact_score: number | null;
  created_at: string;
};

export type BulletinNewsMatchBrief = {
  match_id: string;
  news_title: string;
  news_url: string;
  news_source_name: string | null;
  news_published_at: string | null;
  similarity_score: number | null;
  bill_parliament_id: string | null;
  bill_title: string | null;
  matched_at: string | null;
};

export type BulletinLobbyBrief = {
  id: string;
  organization_name: string;
  category: string | null;
  source_url: string | null;
  source_type: string;
  sentiment_score: number | null;
  summary_json: Record<string, unknown>;
  created_at: string;
  he_tunnus: string | null;
  project_title: string | null;
};

export type BulletinMunicipalBrief = {
  id: string;
  title: string;
  summary: string | null;
  municipality: string;
  created_at: string;
  url: string | null;
};

export type BulletinCommitteeExpertBrief = {
  id: string;
  he_tunnus: string | null;
  title_plain: string;
  expert_name: string | null;
  expert_organization: string | null;
  committee_code: string | null;
  pdf_url: string | null;
  first_seen_at: string;
  source_api_url: string;
};

export type BulletinStatementMetadataBrief = {
  lobbyist_intervention_id: string;
  pdf_url: string;
  expected_organization: string;
  author_field: string | null;
  creator_field: string | null;
  author_mismatch: boolean;
};

export type WeeklyBulletinEditorInput = {
  decisions: BulletinDecisionBrief[];
  newsMatches: BulletinNewsMatchBrief[];
  lobbyInterventions: BulletinLobbyBrief[];
  municipalEspoo: BulletinMunicipalBrief[];
  /** Automaattinen ristiinviittaus: sidonnaisuus vs. lausunnon antaja (HE). */
  potentialInterestConflicts: BulletinInterestConflictHint[];
  committeeExpertInvites: BulletinCommitteeExpertBrief[];
  lobbyStatementMetadataFlags: BulletinStatementMetadataBrief[];
};

export async function fetchWeeklyBulletinEditorInput(
  admin: SupabaseClient,
  startIso: string,
  endIso: string,
): Promise<WeeklyBulletinEditorInput> {
  const out: WeeklyBulletinEditorInput = {
    decisions: [],
    newsMatches: [],
    lobbyInterventions: [],
    municipalEspoo: [],
    potentialInterestConflicts: [],
    committeeExpertInvites: [],
    lobbyStatementMetadataFlags: [],
  };

  const dec = await admin
    .from("decisions")
    .select("id, title, summary, impact_score, created_at")
    .gte("created_at", startIso)
    .lte("created_at", endIso)
    .order("impact_score", { ascending: false, nullsFirst: false })
    .limit(50);

  if (dec.error) {
    if (!/does not exist|Could not find/i.test(dec.error.message))
      log("decisions:", dec.error.message);
  } else {
    out.decisions = (dec.data ?? []) as BulletinDecisionBrief[];
  }

  const news = await admin
    .from("media_watch_feed")
    .select(
      "match_id, news_title, news_url, news_source_name, news_published_at, similarity_score, bill_parliament_id, bill_title, matched_at",
    )
    .gte("matched_at", startIso)
    .lte("matched_at", endIso)
    .order("matched_at", { ascending: false })
    .limit(40);

  if (news.error) {
    if (!/does not exist|Could not find/i.test(news.error.message))
      log("media_watch_feed:", news.error.message);
  } else {
    out.newsMatches = (news.data ?? []) as BulletinNewsMatchBrief[];
  }

  const lob = await admin
    .from("lobbyist_interventions")
    .select(
      "id, organization_name, category, source_url, source_type, sentiment_score, summary_json, created_at, legislative_project_id",
    )
    .gte("created_at", startIso)
    .lte("created_at", endIso)
    .order("created_at", { ascending: false })
    .limit(80);

  if (lob.error) {
    if (!/does not exist|Could not find/i.test(lob.error.message))
      log("lobbyist_interventions:", lob.error.message);
  } else {
    const rows = lob.data ?? [];
    const lpIds = [
      ...new Set(
        rows
          .map((r: { legislative_project_id?: string }) =>
            r.legislative_project_id?.trim(),
          )
          .filter((id): id is string => !!id),
      ),
    ];
    let lpMap = new Map<
      string,
      { he_tunnus: string | null; title: string | null }
    >();
    if (lpIds.length) {
      const lpRes = await admin
        .from("legislative_projects")
        .select("id, he_tunnus, title")
        .in("id", lpIds);
      if (!lpRes.error && lpRes.data) {
        lpMap = new Map(
          (
            lpRes.data as {
              id: string;
              he_tunnus: string | null;
              title: string | null;
            }[]
          ).map((r) => [r.id, { he_tunnus: r.he_tunnus, title: r.title }]),
        );
      }
    }
    out.lobbyInterventions = rows.map(
      (r: {
        id: string;
        organization_name: string;
        category: string | null;
        source_url: string | null;
        source_type: string;
        sentiment_score: number | null;
        summary_json: Record<string, unknown>;
        created_at: string;
        legislative_project_id?: string | null;
      }) => {
        const lp = r.legislative_project_id
          ? lpMap.get(r.legislative_project_id)
          : undefined;
        return {
          id: r.id,
          organization_name: r.organization_name,
          category: r.category,
          source_url: r.source_url,
          source_type: r.source_type,
          sentiment_score: r.sentiment_score,
          summary_json: r.summary_json,
          created_at: r.created_at,
          he_tunnus: lp?.he_tunnus ?? null,
          project_title: lp?.title ?? null,
        };
      },
    );
  }

  const piRes = await admin
    .from("person_interests")
    .select(
      "id, subject_type, mp_id, council_municipality, person_display_name, interest_organization, interest_organization_normalized, declaration_url",
    )
    .limit(5000);

  if (piRes.error) {
    if (!/does not exist|Could not find/i.test(piRes.error.message))
      log("person_interests:", piRes.error.message);
  } else {
    const interestRows = (piRes.data ?? []) as PersonInterestRow[];
    const mpIds = [
      ...new Set(
        interestRows
          .filter((r) => r.subject_type === "mp" && r.mp_id != null)
          .map((r) => r.mp_id as number),
      ),
    ];
    let mpRows: {
      id: number;
      first_name: string | null;
      last_name: string | null;
    }[] = [];
    if (mpIds.length) {
      const mpsRes = await admin
        .from("mps")
        .select("id, first_name, last_name")
        .in("id", mpIds);
      if (!mpsRes.error && mpsRes.data) {
        mpRows = mpsRes.data as typeof mpRows;
      }
    }
    out.potentialInterestConflicts = buildPotentialInterestConflicts(
      out.lobbyInterventions,
      interestRows,
      mpRows,
    );
  }

  const ce = await admin
    .from("committee_expert_invites")
    .select(
      "id, he_tunnus, title_plain, expert_name, expert_organization, committee_code, pdf_url, first_seen_at, source_api_url",
    )
    .gte("first_seen_at", startIso)
    .lte("first_seen_at", endIso)
    .order("first_seen_at", { ascending: false })
    .limit(40);

  if (ce.error) {
    if (!/does not exist|Could not find/i.test(ce.error.message))
      log("committee_expert_invites:", ce.error.message);
  } else {
    out.committeeExpertInvites = (ce.data ??
      []) as BulletinCommitteeExpertBrief[];
  }

  const lobIds = out.lobbyInterventions.map((r) => r.id);
  if (lobIds.length) {
    const meta = await admin
      .from("lobby_statement_document_metadata")
      .select(
        "lobbyist_intervention_id, pdf_url, expected_organization, author_field, creator_field, author_mismatch",
      )
      .in("lobbyist_intervention_id", lobIds)
      .eq("author_mismatch", true)
      .limit(30);

    if (meta.error) {
      if (!/does not exist|Could not find/i.test(meta.error.message))
        log("lobby_statement_document_metadata:", meta.error.message);
    } else {
      out.lobbyStatementMetadataFlags = (meta.data ??
        []) as BulletinStatementMetadataBrief[];
    }
  }

  const muni = await admin
    .from("municipal_decisions")
    .select("id, title, summary, municipality, created_at, url")
    .eq("municipality", "Espoo")
    .gte("created_at", startIso)
    .lte("created_at", endIso)
    .order("created_at", { ascending: false })
    .limit(30);

  if (muni.error) {
    if (!/does not exist|Could not find/i.test(muni.error.message))
      log("municipal_decisions:", muni.error.message);
  } else {
    out.municipalEspoo = (muni.data ?? []) as BulletinMunicipalBrief[];
  }

  return out;
}
