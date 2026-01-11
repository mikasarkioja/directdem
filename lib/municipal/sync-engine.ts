import { createClient } from "@supabase/supabase-js";
import { fetchLatestHelsinkiIssues } from "./helsinki-client";
import { fetchLatestEspooIssues } from "./espoo-client";
import { fetchLatestVantaaIssues } from "./vantaa-client";

export async function syncAllMunicipalities() {
  console.log("--- Starting Unified Municipal Sync (Helsinki, Espoo, Vantaa) ---");
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const results = {
    helsinki: await syncCity(supabase, "Helsinki", fetchLatestHelsinkiIssues),
    espoo: await syncCity(supabase, "Espoo", fetchLatestEspooIssues),
    vantaa: await syncCity(supabase, "Vantaa", fetchLatestVantaaIssues)
  };

  console.log("--- Sync Complete ---");
  console.log(JSON.stringify(results, null, 2));
  
  return results;
}

async function syncCity(supabase: any, city: string, fetchFn: (limit: number) => Promise<any[]>) {
  try {
    const issues = await fetchFn(20);
    if (issues.length === 0) return { success: true, count: 0, note: "No data found or API down" };

    const mapped = issues.map(issue => ({
      external_id: issue.issue_id || issue.id,
      municipality: city,
      title: issue.subject || issue.title,
      content_summary: issue.summary, // Actual DB column
      proposer: issue.proposer,
      status: "OPEN",
      decision_date: issue.last_modified || issue.modified // Actual DB column
    }));

    const { error } = await supabase
      .from("municipal_decisions")
      .upsert(mapped, { onConflict: 'external_id' });

    if (error) throw error;

    return { success: true, count: mapped.length };
  } catch (error: any) {
    console.error(`Sync failed for ${city}:`, error.message);
    return { success: false, error: error.message };
  }
}

