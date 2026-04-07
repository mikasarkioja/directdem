import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getResendFromEmail, sendResendEmail } from "@/lib/resend";
import { generateWeeklyReportEmailPayload } from "@/lib/bulletin/generator";
import { scanEspooLobbyTraceability } from "@/lib/municipal/espoo-lobby-traceability";

export const maxDuration = 300;
const logger = {
  info: (...args: unknown[]) => console.log("[WeeklyBulletinCron]", ...args),
  warn: (...args: unknown[]) => console.warn("[WeeklyBulletinCron]", ...args),
  error: (...args: unknown[]) => console.error("[WeeklyBulletinCron]", ...args),
};

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

    // 1) Refresh Espoo lobby traceability data before bulletin generation
    try {
      await scanEspooLobbyTraceability();
    } catch (scanError: any) {
      logger.error("Espoo lobby scan failed:", scanError?.message ?? scanError);
    }

    // 2) Create bulletin content once (generic mass send content)
    const payload = await generateWeeklyReportEmailPayload();

    // 3) Save archive first
    const archiveResult = await supabase.from("newsletter_archive").insert({
      generated_html: payload.html,
      sent_at: new Date().toISOString(),
    });
    if (archiveResult.error) {
      logger.error("Failed to archive bulletin:", archiveResult.error.message);
    }

    // 4) Fetch active recipients
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

    const recipientEmails = (subscribers ?? [])
      .map((s) => s.email)
      .filter((email): email is string => Boolean(email));

    // 5) Mass send the same generated content to everyone
    let sentCount = 0;
    let sendErrors = 0;
    const batchSize = 50; // bonus: lightweight batch sending in chunks
    for (let i = 0; i < recipientEmails.length; i += batchSize) {
      const chunk = recipientEmails.slice(i, i + batchSize);
      try {
        await sendResendEmail({
          from: fromEmail,
          to: chunk,
          subject: `DirectDem viikkobulletiini - ${payload.issueDate}`,
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
        subscribersFound: recipientEmails.length,
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
