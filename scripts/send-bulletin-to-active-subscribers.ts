/**
 * Lähetä yksi viikkolehti kaikille aktiivisille newsletter_subscribers-riveille.
 * Ei lisää ADMIN_EMAIL-vastaanottajia (vain tilaajataulu).
 *
 * Lataa .env.local (kuten muut skriptit).
 *
 * Usage:
 *   npx tsx scripts/send-bulletin-to-active-subscribers.ts --dry-run
 *   npx tsx scripts/send-bulletin-to-active-subscribers.ts --send
 *
 * --dry-run: listaa vastaanottajat, generoi HTML, ei Resendiä.
 * --send:    lähettää (tuotantoresendi: älä aseta RESEND_FORCE_SANDBOX).
 */

import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

function parseArgs(): { dryRun: boolean; send: boolean } {
  const raw = process.argv.slice(2);
  const dryRun = raw.includes("--dry-run");
  const send = raw.includes("--send");
  return { dryRun, send };
}

async function main() {
  const { dryRun, send } = parseArgs();

  if (send && dryRun) {
    console.error("Valitse joko --send tai --dry-run, ei molempia.");
    process.exit(1);
  }
  if (!send && !dryRun) {
    console.error(
      "Puuttuva tila: aja joko --dry-run (esikatselu) tai --send (oikea lähetys).",
    );
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) {
    console.error(
      "NEXT_PUBLIC_SUPABASE_URL ja SUPABASE_SERVICE_ROLE_KEY vaaditaan .env.localissa.",
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey);
  const { data: rows, error } = await supabase
    .from("newsletter_subscribers")
    .select("email")
    .eq("is_active", true);

  if (error) {
    console.error("newsletter_subscribers:", error.message);
    process.exit(1);
  }

  const emails = (rows ?? [])
    .map((r: { email: string | null }) => r.email?.trim().toLowerCase())
    .filter((e: string | undefined): e is string => Boolean(e));

  const unique = [...new Set(emails)];

  console.log(`Aktiivisia tilaajia (uniikit): ${unique.length}`);
  if (unique.length === 0) {
    console.log("Ei vastaanottajia — lopetetaan.");
    process.exit(0);
  }
  console.log(unique.join(", "));

  const { generateWeeklyReportEmailPayload } =
    await import("../lib/bulletin/generator");
  console.log("Generoidaan viikkolehti…");
  const payload = await generateWeeklyReportEmailPayload();
  console.log("Valmis:", payload.issueDate, "variant:", payload.variant ?? "?");

  if (dryRun) {
    console.log(
      "[dry-run] Ei lähetystä. HTML-pituus:",
      payload.html?.length ?? 0,
      "tavua",
    );
    process.exit(0);
  }

  const { getResendFromEmail, sendResendEmail } = await import("../lib/resend");
  const fromEmail = getResendFromEmail();
  const subject = `[Koelähetys] Omatase viikkolehti – ${payload.issueDate}`;
  const batchSize = 50;
  let sent = 0;
  for (let i = 0; i < unique.length; i += batchSize) {
    const chunk = unique.slice(i, i + batchSize);
    const { id } = await sendResendEmail({
      from: fromEmail,
      to: chunk,
      subject,
      html: payload.html,
    });
    sent += chunk.length;
    console.log(`Lähetetty ${sent}/${unique.length} (erä Resend id: ${id})`);
  }
  console.log("Valmis — koelähetys tilaajille.");
}

main().catch((e) => {
  console.error(e?.message ?? e);
  process.exit(1);
});
