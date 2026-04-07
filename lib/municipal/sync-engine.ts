import { createClient } from "@supabase/supabase-js";
import { fetchLatestHelsinkiIssues } from "./helsinki-client";
import { fetchLatestEspooIssues } from "./espoo-client";
import { fetchLatestVantaaIssues } from "./vantaa-client";

export async function syncAllMunicipalities() {
  console.log(
    "--- Starting Unified Municipal Sync (Helsinki, Espoo, Vantaa) ---",
  );

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const results = {
    helsinki: await syncCity(supabase, "Helsinki", fetchLatestHelsinkiIssues),
    espoo: await syncCity(supabase, "Espoo", fetchLatestEspooIssues),
    vantaa: await syncCity(supabase, "Vantaa", fetchLatestVantaaIssues),
  };

  console.log("--- Sync Complete ---");
  console.log(JSON.stringify(results, null, 2));

  return results;
}

function needsKeyBasedMunicipalUpsert(message: string | undefined): boolean {
  return !!message && /no unique or exclusion constraint/i.test(message);
}

/** Works when there is no unique index on (municipality, external_id) yet. */
async function upsertMunicipalDecisionsByNaturalKey(
  supabase: any,
  rows: Record<string, unknown>[],
): Promise<{ error: { message: string } | null }> {
  const now = new Date().toISOString();
  for (const row of rows) {
    const extRaw = row.external_id;
    const ext = extRaw != null ? String(extRaw).trim() : "";
    const muni = String(row.municipality ?? "");

    if (!ext) {
      const { error } = await supabase.from("municipal_decisions").insert(row);
      if (error) return { error };
      continue;
    }

    const { data: existing, error: selErr } = await supabase
      .from("municipal_decisions")
      .select("id")
      .eq("municipality", muni)
      .eq("external_id", ext)
      .maybeSingle();

    if (selErr) return { error: selErr };

    if (existing?.id) {
      const { error } = await supabase
        .from("municipal_decisions")
        .update({ ...row, updated_at: now })
        .eq("id", existing.id);
      if (error) return { error };
    } else {
      const { error } = await supabase.from("municipal_decisions").insert(row);
      if (error) return { error };
    }
  }
  return { error: null };
}

async function syncCity(
  supabase: any,
  city: string,
  fetchFn: (limit: number) => Promise<any[]>,
) {
  try {
    const issues = await fetchFn(20);
    if (issues.length === 0)
      return { success: true, count: 0, note: "No data found or API down" };

    const mapped = issues.map((issue: Record<string, unknown>) => {
      const idStr = String(issue.issue_id ?? issue.id ?? "");
      const espooUrl =
        typeof issue.id === "string" && issue.id.startsWith("http")
          ? issue.id
          : null;
      return {
        external_id: idStr,
        municipality: city,
        title: (issue.subject ?? issue.title) as string,
        summary: issue.summary as string,
        category: issue.category as string | undefined,
        decision_date: (issue.last_modified ?? issue.modified) as string,
        url: (issue.detail_url as string | undefined) ?? espooUrl,
      };
    });

    let { error } = await supabase
      .from("municipal_decisions")
      .upsert(mapped, { onConflict: "municipality,external_id" });

    if (error && needsKeyBasedMunicipalUpsert(error.message)) {
      const manual = await upsertMunicipalDecisionsByNaturalKey(
        supabase,
        mapped,
      );
      error = manual.error;
    }

    if (error) throw error;

    return { success: true, count: mapped.length };
  } catch (error: any) {
    console.error(`Sync failed for ${city}:`, error.message);
    return { success: false, error: error.message };
  }
}
