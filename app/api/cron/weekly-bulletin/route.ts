import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getResendFromEmail, sendResendEmail } from "@/lib/resend";
import { generateWeeklyReportEmailPayload } from "@/lib/bulletin/generator";
import { syncBulletinFeedTables } from "@/lib/bulletin/sync-feed-from-sources";
import { scanEspooLobbyTraceability } from "@/lib/municipal/espoo-lobby-traceability";

export const maxDuration = 300;
const logger = {
  info: (...args: unknown[]) => console.log("[WeeklyBulletinCron]", ...args),
  warn: (...args: unknown[]) => console.warn("[WeeklyBulletinCron]", ...args),
  error: (...args: unknown[]) => console.error("[WeeklyBulletinCron]", ...args),
};

/** Vastaanottajat `ADMIN_EMAIL`-muuttujasta (pilkuilla erotettu lista sallittu). */
function adminEmailsFromEnv(): string[] {
  const raw = process.env.ADMIN_EMAIL?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes("@"));
}

function mergeRecipients(
  subscribers: string[],
  admins: string[],
): { emails: string[]; adminAdded: number } {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const email of subscribers) {
    const key = email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(email);
  }
  let adminAdded = 0;
  for (const email of admins) {
    const key = email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(email);
    adminAdded += 1;
  }
  return { emails: out, adminAdded };
}

export async function GET(request: NextRequest) {
  const startedAt = new Date().toISOString();

  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      logger.warn("Unauthorized request.");
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          startedAt,
          finishedAt: new Date().toISOString(),
        },
        { status: 401 },
      );
    }

    const supabase = await createAdminClient();
    const fromEmail = getResendFromEmail();

    // 1) Hydrate national + lobby + municipal feed rows from source tables
    try {
      const syncResult = await syncBulletinFeedTables(supabase);
      logger.info("Bulletin feed sync:", syncResult);
      if (syncResult.errors.length) {
        logger.warn("Bulletin feed sync had errors:", syncResult.errors);
      }
    } catch (syncError: any) {
      logger.error(
        "Bulletin feed sync failed:",
        syncError?.message ?? syncError,
      );
    }

    // 2) Refresh Espoo lobby traceability (espoo_lobby_traces) before generation
    try {
      await scanEspooLobbyTraceability();
    } catch (scanError: any) {
      logger.error("Espoo lobby scan failed:", scanError?.message ?? scanError);
    }

    // 3) Create bulletin content once (mass send uses same HTML for all)
    const payload = await generateWeeklyReportEmailPayload();

    // 4) Save archive first
    const archiveResult = await supabase.from("newsletter_archive").insert({
      generated_html: payload.html,
      sent_at: new Date().toISOString(),
    });
    if (archiveResult.error) {
      logger.error("Failed to archive bulletin:", archiveResult.error.message);
    }

    // 5) Fetch active recipients
    let subscribersErrorMessage: string | null = null;
    const { data: subscribers, error: subscribersError } = await supabase
      .from("newsletter_subscribers")
      .select("email")
      .eq("is_active", true);

    if (subscribersError) {
      subscribersErrorMessage = subscribersError.message;
      logger.error(
        "newsletter_subscribers query failed:",
        subscribersErrorMessage,
      );
    }

    const subscriberEmails = (subscribers ?? [])
      .map((s) => s.email)
      .filter((email): email is string => Boolean(email));

    const adminEmails = adminEmailsFromEnv();
    const { emails: recipientEmails, adminAdded } = mergeRecipients(
      subscriberEmails,
      adminEmails,
    );
    if (adminEmails.length) {
      logger.info(
        "ADMIN_EMAIL:",
        adminEmails.join(", "),
        adminAdded > 0
          ? `(+${adminAdded} not already in subscriber list)`
          : "(all already subscribers)",
      );
    }

    // 6) Mass send the same generated content to everyone
    let sentCount = 0;
    let sendErrors = 0;
    const batchSize = 50; // bonus: lightweight batch sending in chunks
    for (let i = 0; i < recipientEmails.length; i += batchSize) {
      const chunk = recipientEmails.slice(i, i + batchSize);
      try {
        await sendResendEmail({
          from: fromEmail,
          to: chunk,
          subject: `Omatase viikkolehti – ${payload.issueDate}`,
          html: payload.html,
        });
        sentCount += chunk.length;
      } catch (error: any) {
        sendErrors += chunk.length;
        logger.error(
          `Failed to send chunk starting at index ${i}:`,
          error?.message ?? error,
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        startedAt,
        finishedAt: new Date().toISOString(),
        subscribersFromDb: subscriberEmails.length,
        adminEmailsConfigured: adminEmails.length,
        adminRecipientsMerged: adminAdded,
        totalRecipients: recipientEmails.length,
        sentCount,
        sendErrors,
        queryWarnings: {
          subscribers: subscribersErrorMessage,
          archive: archiveResult.error?.message ?? null,
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    logger.error("Fatal error:", error);
    return NextResponse.json(
      {
        success: false,
        startedAt,
        finishedAt: new Date().toISOString(),
        error: error?.message ?? "Unknown error",
      },
      { status: 500 },
    );
  }
}
