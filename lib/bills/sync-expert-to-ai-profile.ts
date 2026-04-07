import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Keeps bill_ai_profiles.expert_impact_assessment in sync with the main selkokieli
 * analysis (asiantuntijaselonteko & vaikutusarviointi) shown in BillDetail.
 * Caller must use a service-role Supabase client (RLS has no public INSERT on this table).
 */
export async function syncExpertImpactToBillAiProfile(
  admin: SupabaseClient,
  billId: string,
  expertMarkdown: string | null | undefined,
): Promise<void> {
  const body = (expertMarkdown ?? "").trim();
  if (!body || body.length < 80) return;

  const { error } = await admin.from("bill_ai_profiles").upsert(
    {
      bill_id: billId,
      expert_impact_assessment: body.slice(0, 200_000),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "bill_id" },
  );

  if (error) {
    console.warn(
      "[syncExpertImpactToBillAiProfile] upsert skipped:",
      error.message,
    );
  }
}
