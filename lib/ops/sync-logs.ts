import type { SupabaseClient } from "@supabase/supabase-js";

type SyncLogStatus = "success" | "failed" | "dry_run";

/**
 * Kirjaa cron-ingest-ajon (process-bills yms.). Health check käyttää last_sync.
 */
export async function recordSyncAttempt(
  admin: SupabaseClient,
  serviceName: string,
  status: SyncLogStatus,
): Promise<void> {
  const { error } = await admin.from("sync_logs").insert({
    service_name: serviceName,
    status,
    last_sync: new Date().toISOString(),
  });
  if (error) {
    console.warn("[sync_logs] insert failed:", error.message);
  }
}

export async function recordSyncSuccess(
  admin: SupabaseClient,
  serviceName: string,
): Promise<void> {
  return recordSyncAttempt(admin, serviceName, "success");
}
