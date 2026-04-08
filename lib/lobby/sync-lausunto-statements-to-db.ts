import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchLausuntoSourcesForHe } from "@/lib/lobby/collectors/lausuntopalvelu";

/**
 * Hakee Lausuntopalvelu.fi -listaukset per HE ja upserttaa `lobbyist_interventions`
 * (source_type = statement). Pakota LOBBY_TRACE_USE_MOCK=false ennen tätä (skriptissä).
 */
export async function syncLausuntoStatementsToInterventions(
  admin: SupabaseClient,
  options?: { maxProjects?: number },
): Promise<{
  upserted: number;
  projectsProcessed: number;
  errors: string[];
}> {
  const maxProjects = options?.maxProjects ?? 40;
  const errors: string[] = [];
  let upserted = 0;

  const { data: projects, error: lpErr } = await admin
    .from("legislative_projects")
    .select("id, he_tunnus, bill_id")
    .order("updated_at", { ascending: false })
    .limit(maxProjects);

  if (lpErr) {
    return { upserted: 0, projectsProcessed: 0, errors: [lpErr.message] };
  }
  if (!projects?.length) {
    return { upserted: 0, projectsProcessed: 0, errors: [] };
  }

  for (const p of projects as {
    id: string;
    he_tunnus: string;
    bill_id: string | null;
  }[]) {
    const docs = await fetchLausuntoSourcesForHe(p.he_tunnus);
    if (!docs.length) continue;

    const payloads = docs.map((doc) => {
      const urlHash = createHash("sha256").update(doc.sourceUrl).digest("hex");
      const orgGuess =
        doc.organizationHint?.trim() ||
        doc.title.split(/[–—\-|]/)[0]?.trim() ||
        doc.title;
      const org = (orgGuess || "Lausunto").slice(0, 500);
      const plain =
        doc.textContent.replace(/\s+/g, " ").trim().slice(0, 2000) || doc.title;

      return {
        legislative_project_id: p.id,
        bill_id: p.bill_id,
        organization_name: org,
        category: "Lausuntopalvelu",
        summary_json: {
          plainLanguageSummary: plain,
          source: "lausuntopalvelu",
          title: doc.title,
        },
        sentiment_score: null,
        source_url: doc.sourceUrl,
        source_type: "statement",
        source_external_id: urlHash.slice(0, 64),
        dedupe_key: `lausunto:${urlHash}`,
        raw_excerpt: doc.textContent.slice(0, 2000),
        analysis_model: null,
      };
    });

    const { error } = await admin
      .from("lobbyist_interventions")
      .upsert(payloads, {
        onConflict: "dedupe_key",
      });
    if (error) errors.push(`${p.he_tunnus}: ${error.message}`);
    else upserted += payloads.length;
  }

  return {
    upserted,
    projectsProcessed: projects.length,
    errors,
  };
}
