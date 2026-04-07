/**
 * Generate the weekly bulletin (same as cron) and send one test message via Resend.
 * Loads .env.local first so @/lib/env sees secrets.
 *
 * Usage:
 *   npx tsx scripts/send-test-weekly-bulletin.ts [email]
 *   npx tsx scripts/send-test-weekly-bulletin.ts --fixture [email]
 *
 * --fixture: skip Supabase/OpenAI; sends a static sample layout (for Resend/domain checks).
 * Email defaults to ADMIN_EMAIL env or mika.sarkioja@gmail.com
 */

import dotenv from "dotenv";
import path from "path";
import { render } from "@react-email/render";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const defaultAdmin = "mika.sarkioja@gmail.com";

function parseArgs(): { fixture: boolean; to: string } {
  const raw = process.argv.slice(2);
  let fixture = false;
  const rest: string[] = [];
  for (const a of raw) {
    if (a === "--fixture") fixture = true;
    else rest.push(a);
  }
  const to =
    rest[0]?.trim().toLowerCase() ||
    process.env.ADMIN_EMAIL?.trim().toLowerCase() ||
    defaultAdmin;
  return { fixture, to };
}

async function main() {
  const { fixture, to } = parseArgs();
  const { getResendClient } = await import("../lib/resend");

  let issueDate: string;
  let html: string;

  if (fixture) {
    const WeeklyBulletin = (await import("../components/emails/WeeklyBulletin"))
      .default;
    issueDate = new Date().toLocaleDateString("fi-FI", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    console.log("[test-bulletin] Fixture mode (no DB / OpenAI)");
    html = await render(
      WeeklyBulletin({
        issueDate,
        parliamentData: {
          summary:
            "Tämä on testilähetys: tuotantotietokannassa tarvitaan taulut (decisions, lobbyist_traces, …) ja OPENAI_API_KEY täyttöön.",
          predictions: [
            {
              title: "Esimerkki: lakiuudistus etenee valiokuntaan",
              probability: 62,
              trend: "Vakaa",
            },
          ],
          lobbyistHits: [
            {
              title: "Esimerkki: lausuntokierros",
              similarity: 71,
              actor: "Testiorganisaatio",
            },
          ],
          deficitIndicator: {
            title: "Demokratiavaje-indeksi (demo)",
            percentage: 42,
          },
        },
        espooData: {
          summary: "Espoo-osio näkyy tässä testissä staattisena tekstinä.",
          updates: [
            {
              title: "Esimerkkipäätös",
              category: "Kaupunkisuunnittelu",
              description: "Kuvitteellinen kuvaus testiviestissä.",
            },
          ],
        },
      }),
    );
  } else {
    const { generateWeeklyReportEmailPayload } =
      await import("../lib/bulletin/generator");
    console.log(
      "[test-bulletin] Generating HTML (live data from Supabase + OpenAI)…",
    );
    const payload = await generateWeeklyReportEmailPayload();
    issueDate = payload.issueDate;
    html = payload.html;
  }

  const resend = getResendClient();
  const fromEmail =
    process.env.RESEND_FROM_EMAIL ?? "noreply@eduskuntavahti.fi";

  console.log("[test-bulletin] Sending to", to);
  await resend.emails.send({
    from: fromEmail,
    to,
    subject: `[TESTI] DirectDem viikkobulletiini - ${issueDate}`,
    html,
  });

  console.log("[test-bulletin] OK — check inbox (and spam) for", to);
}

main().catch((e) => {
  console.error("[test-bulletin] Failed:", e?.message ?? e);
  process.exit(1);
});
