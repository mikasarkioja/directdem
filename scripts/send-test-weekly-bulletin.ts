/**
 * Generate the weekly bulletin (same as cron) and send one test message via Resend.
 * Loads .env.local first so @/lib/env sees secrets.
 *
 * Usage:
 *   npx tsx scripts/send-test-weekly-bulletin.ts [email]
 *   npx tsx scripts/send-test-weekly-bulletin.ts --fixture [email]
 *   npx tsx scripts/send-test-weekly-bulletin.ts --fixture --use-env-from [email]
 *
 * --fixture: skip Supabase/OpenAI; sends a static sample layout (for Resend/domain checks).
 * By default this script sets RESEND_FORCE_SANDBOX so `from` uses onboarding@resend.dev
 * (works without verifying your domain). Pass --use-env-from to use RESEND_FROM_EMAIL instead.
 * Email defaults to ADMIN_EMAIL env or mika.sarkioja@gmail.com
 */

import dotenv from "dotenv";
import path from "path";
import { render } from "@react-email/render";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const defaultAdmin = "mika.sarkioja@gmail.com";

function parseArgs(): {
  fixture: boolean;
  to: string;
  useEnvFrom: boolean;
} {
  const raw = process.argv.slice(2);
  let fixture = false;
  let useEnvFrom = false;
  const rest: string[] = [];
  for (const a of raw) {
    if (a === "--fixture") fixture = true;
    else if (a === "--use-env-from") useEnvFrom = true;
    else rest.push(a);
  }
  const to =
    rest[0]?.trim().toLowerCase() ||
    process.env.ADMIN_EMAIL?.trim().toLowerCase() ||
    defaultAdmin;
  return { fixture, to, useEnvFrom };
}

async function main() {
  const { fixture, to, useEnvFrom } = parseArgs();
  if (!useEnvFrom) {
    process.env.RESEND_FORCE_SANDBOX = "true";
  }
  const { getResendFromEmail, sendResendEmail } = await import("../lib/resend");

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

  const fromEmail = getResendFromEmail();

  console.log("[test-bulletin] From:", fromEmail);
  console.log("[test-bulletin] Sending to", to);
  const { id } = await sendResendEmail({
    from: fromEmail,
    to,
    subject: `[TESTI] DirectDem viikkobulletiini - ${issueDate}`,
    html,
  });

  console.log(
    "[test-bulletin] OK — Resend id:",
    id,
    "— check inbox and spam for",
    to,
  );
}

main().catch((e) => {
  console.error("[test-bulletin] Failed:", e?.message ?? e);
  process.exit(1);
});
