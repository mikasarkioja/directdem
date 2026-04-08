/**
 * Synkkaa valiokuntien asiantuntijakuulemisia Vaski-aineistosta (`committee_expert_invites`).
 * Aiemmat parametrit säilytetään allekirjoituksen yhteensopivuuden vuoksi.
 */
import { createAdminClient } from "@/lib/supabase/server";
import { syncCommitteeExpertInvitesFromVaski } from "@/lib/lobby/sync-committee-experts-db";

export async function scrapeExpertStatements(
  _billId: string,
  _parliamentId: string,
) {
  const admin = await createAdminClient();
  const res = await syncCommitteeExpertInvitesFromVaski(admin, {
    maxPages: 2,
  });
  return res.error
    ? { success: false as const, error: res.error }
    : { success: true as const, count: res.attempted };
}
