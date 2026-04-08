/**
 * Synkronoi Eduskunnan Vaskin Asiantuntijalausunto-asiakirjat → committee_expert_invites
 * ja lobbyist_interventions (expert_hearing). Hakee Lausuntopalvelu.fi → statement.
 *
 * Vaatii: NEXT_PUBLIC_SUPABASE_URL ja SUPABASE_SERVICE_ROLE_KEY (.env.local)
 * Pakottaa LOBBY_TRACE_USE_MOCK=false jotta lausuntodata haetaan oikeasti.
 *
 * Aja: npx tsx scripts/sync-committee-experts-vaski.ts
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import { syncCommitteeExpertInvitesFromVaski } from "@/lib/lobby/sync-committee-experts-db";
import { syncLausuntoStatementsToInterventions } from "@/lib/lobby/sync-lausunto-statements-to-db";
import { recordSyncSuccess } from "@/lib/ops/sync-logs";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
process.env.LOBBY_TRACE_USE_MOCK = "false";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "Puuttuvat NEXT_PUBLIC_SUPABASE_URL tai SUPABASE_SERVICE_ROLE_KEY",
    );
    process.exit(1);
  }
  const admin = createClient(url, key);
  const maxPages = 8;
  const res = await syncCommitteeExpertInvitesFromVaski(admin, { maxPages });
  if (res.error) {
    console.error(res.error);
    process.exit(1);
  }
  console.log(
    "committee_expert_invites: rivit yritetty (uudet Id:t tallentuvat, vanhat ohitetaan):",
    res.attempted,
  );
  if (typeof res.lobbyistInterventionsUpserted === "number") {
    console.log(
      "lobbyist_interventions (expert_hearing): upsert-eriä:",
      res.lobbyistInterventionsUpserted,
    );
  }
  if (res.lobbyistInterventionsErrors?.length) {
    console.warn(
      "lobbyist_interventions (expert) varoitukset:",
      res.lobbyistInterventionsErrors.join("; "),
    );
  }

  const lausunto = await syncLausuntoStatementsToInterventions(admin, {
    maxProjects: 50,
  });
  console.log(
    `lausuntopalvelu → lobbyist_interventions (statement): ${lausunto.upserted} riviä, ${lausunto.projectsProcessed} hanketta käyty`,
  );
  if (lausunto.errors.length) {
    console.warn("lausunto-upsert varoitukset:", lausunto.errors.join("; "));
  }

  await recordSyncSuccess(admin, "sync-committee-experts-vaski");
  await recordSyncSuccess(admin, "sync-lobbyist-interventions-ingest");
}

main();
