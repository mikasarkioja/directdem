import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchAndInspectPdfAuthorVsOrganization } from "@/lib/lobby/pdf-metadata-inspector";

/**
 * Tallenna tai päivitä PDF-metatarkistus `lobby_statement_document_metadata`-tauluun.
 */
export async function upsertLobbyStatementPdfInspection(
  admin: SupabaseClient,
  lobbyistInterventionId: string,
  pdfUrl: string,
  expectedOrganization: string,
): Promise<{ ok: boolean; error?: string; authorMismatch?: boolean }> {
  const inspected = await fetchAndInspectPdfAuthorVsOrganization(
    pdfUrl,
    expectedOrganization,
  );
  if (!inspected.ok) {
    return { ok: false, error: inspected.error };
  }

  const row = {
    lobbyist_intervention_id: lobbyistInterventionId,
    pdf_url: pdfUrl,
    author_field: inspected.authorField,
    creator_field: inspected.creatorField,
    producer_field: inspected.producerField,
    title_field: inspected.titleField,
    expected_organization: expectedOrganization,
    author_mismatch: inspected.authorMismatch,
  };

  const res = await admin
    .from("lobby_statement_document_metadata")
    .upsert(row, {
      onConflict: "lobbyist_intervention_id,pdf_url",
    });
  if (res.error) return { ok: false, error: res.error.message };

  return { ok: true, authorMismatch: inspected.authorMismatch };
}
