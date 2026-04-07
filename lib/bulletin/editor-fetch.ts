import type { SupabaseClient } from "@supabase/supabase-js";

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

export type WeeklyBulletinEditorInput = {
  decisions: BulletinDecisionBrief[];
  newsMatches: BulletinNewsMatchBrief[];
  lobbyInterventions: BulletinLobbyBrief[];
  municipalEspoo: BulletinMunicipalBrief[];
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
