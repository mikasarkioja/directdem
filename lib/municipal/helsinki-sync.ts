import { createClient } from "@supabase/supabase-js";
import { fetchLatestHelsinkiIssues } from "./helsinki-client";

/**
 * Syncs the latest Helsinki municipal decisions into the database.
 */
export async function syncHelsinkiDecisions() {
  console.log("--- Starting Helsinki Sync ---");
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const issues = await fetchLatestHelsinkiIssues(20);
  
  if (issues.length === 0) {
    console.warn("No issues found to sync.");
    return { success: false, count: 0 };
  }

  const mappedDecisions = issues.map(issue => ({
    external_id: `HEL-${issue.id}`,
    municipality: "Helsinki",
    title: issue.subject,
    summary: issue.summary,
    proposer: issue.proposer,
    category: issue.category,
    status: "OPEN", // Default status
    last_modified: issue.last_modified
  }));

  const { data, error } = await supabase
    .from("municipal_decisions")
    .upsert(mappedDecisions, { 
      onConflict: 'external_id' 
    });

  if (error) {
    console.error("Sync failed:", error.message);
    return { success: false, error: error.message };
  }

  console.log(`✅ Sync complete: ${mappedDecisions.length} decisions updated.`);
  return { success: true, count: mappedDecisions.length };
}

