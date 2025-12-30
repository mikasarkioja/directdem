"use server";

import { createClient } from "@/lib/supabase/server";
import { getResendClient } from "@/lib/resend";
import WeeklyReportEmail from "@/components/emails/WeeklyReportEmail";
import { render } from "@react-email/render";

/**
 * Generates and sends weekly report to all users who have opted in
 * Returns summary of sent emails
 */
export async function sendWeeklyReport(): Promise<{
  success: boolean;
  emailsSent: number;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // 1. Get all users who have opted in to the report list with their emails
    const { data: optedInUsers, error: usersError } = await supabase
      .from("profiles")
      .select("id")
      .eq("join_report_list", true);

    if (usersError) {
      console.error("[sendWeeklyReport] Error fetching opted-in users:", usersError);
      return {
        success: false,
        emailsSent: 0,
        error: `Failed to fetch opted-in users: ${usersError.message}`,
      };
    }

    if (!optedInUsers || optedInUsers.length === 0) {
      return {
        success: true,
        emailsSent: 0,
      };
    }

    const userIds = optedInUsers.map((u) => u.id);

    // 2. Get user emails from profiles table (email should be synced from auth.users)
    const { data: profilesWithEmail, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", userIds)
      .not("email", "is", null);

    if (profilesError) {
      console.error("[sendWeeklyReport] Error fetching profiles with emails:", profilesError);
      return {
        success: false,
        emailsSent: 0,
        error: `Failed to fetch user emails: ${profilesError.message}`,
      };
    }

    const optedInUserEmails = (profilesWithEmail || [])
      .map((p) => ({ id: p.id, email: p.email }))
      .filter((p) => p.email); // Only users with email

    if (optedInUserEmails.length === 0) {
      return {
        success: true,
        emailsSent: 0,
      };
    }

    // 3. Get votes from opted-in users for the past week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: votes, error: votesError } = await supabase
      .from("votes")
      .select(`
        id,
        position,
        created_at,
        bills!inner (
          id,
          title,
          parliament_id,
          status
        )
      `)
      .in("user_id", userIds)
      .gte("created_at", oneWeekAgo.toISOString())
      .order("created_at", { ascending: false });

    if (votesError) {
      console.error("[sendWeeklyReport] Error fetching votes:", votesError);
      return {
        success: false,
        emailsSent: 0,
        error: `Failed to fetch votes: ${votesError.message}`,
      };
    }

    // 4. Aggregate votes by bill (same logic as weekly-report route)
    const billVoteMap = new Map<
      string,
      {
        billId: string;
        parliamentId: string;
        title: string;
        status: string;
        for: number;
        against: number;
        neutral: number;
        total: number;
      }
    >();

    for (const vote of votes || []) {
      const bill = (vote as any).bills;
      if (!bill) continue;

      const billId = bill.id;
      if (!billVoteMap.has(billId)) {
        billVoteMap.set(billId, {
          billId: bill.id,
          parliamentId: bill.parliament_id || "Unknown",
          title: bill.title || "Untitled",
          status: bill.status || "unknown",
          for: 0,
          against: 0,
          neutral: 0,
          total: 0,
        });
      }

      const billData = billVoteMap.get(billId)!;
      billData.total++;
      if (vote.position === "for") {
        billData.for++;
      } else if (vote.position === "against") {
        billData.against++;
      } else {
        billData.neutral++;
      }
    }

    // 5. Format report data
    const reportData = Array.from(billVoteMap.values()).map((bill) => ({
      parliamentId: bill.parliamentId,
      title: bill.title,
      status: bill.status,
      votes: {
        for: bill.for,
        against: bill.against,
        neutral: bill.neutral,
        total: bill.total,
      },
      percentages: {
        for: bill.total > 0 ? Math.round((bill.for / bill.total) * 100) : 0,
        against: bill.total > 0 ? Math.round((bill.against / bill.total) * 100) : 0,
        neutral: bill.total > 0 ? Math.round((bill.neutral / bill.total) * 100) : 0,
      },
    }));

    // 6. Calculate week dates
    const weekEnd = new Date();
    const weekStart = new Date(oneWeekAgo);
    const weekStartStr = weekStart.toLocaleDateString("fi-FI", {
      day: "numeric",
      month: "long",
    });
    const weekEndStr = weekEnd.toLocaleDateString("fi-FI", {
      day: "numeric",
      month: "long",
    });

    // 7. Render email HTML
    const emailHtml = await render(
      WeeklyReportEmail({
        reportData,
        totalUsers: optedInUserEmails.length,
        totalVotes: votes?.length || 0,
        weekStart: weekStartStr,
        weekEnd: weekEndStr,
      })
    );

    // 8. Initialize Resend and send emails
    const resend = getResendClient();
    const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@eduskuntavahti.fi";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://eduskuntavahti.fi";

    let emailsSent = 0;
    const errors: string[] = [];

    for (const user of optedInUserEmails) {
      try {
        await resend.emails.send({
          from: fromEmail,
          to: user.email!,
          subject: `Eduskuntavahti - Viikkoraportti ${weekStartStr} - ${weekEndStr}`,
          html: emailHtml,
        });
        emailsSent++;
      } catch (emailError: any) {
        console.error(`[sendWeeklyReport] Failed to send email to ${user.email}:`, emailError);
        errors.push(`${user.email}: ${emailError.message}`);
      }
    }

    if (emailsSent === 0 && errors.length > 0) {
      return {
        success: false,
        emailsSent: 0,
        error: `Failed to send emails: ${errors.join("; ")}`,
      };
    }

    return {
      success: true,
      emailsSent,
    };
  } catch (error: any) {
    console.error("[sendWeeklyReport] Unexpected error:", error);
    return {
      success: false,
      emailsSent: 0,
      error: error.message || "Failed to send weekly report",
    };
  }
}

/**
 * Sends a test report to the current admin user
 */
export async function sendTestReport(): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return {
        success: false,
        error: "User not authenticated or no email found",
      };
    }

    // Get mock report data for testing
    const reportData = [
      {
        parliamentId: "HE 123/2024",
        title: "Test Lakiesitys - Viikkoraportin testaus",
        status: "voting",
        votes: {
          for: 65,
          against: 25,
          neutral: 10,
          total: 100,
        },
        percentages: {
          for: 65,
          against: 25,
          neutral: 10,
        },
      },
    ];

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekStartStr = weekStart.toLocaleDateString("fi-FI", {
      day: "numeric",
      month: "long",
    });
    const weekEndStr = new Date().toLocaleDateString("fi-FI", {
      day: "numeric",
      month: "long",
    });

    // Render email HTML
    const emailHtml = await render(
      WeeklyReportEmail({
        reportData,
        totalUsers: 1,
        totalVotes: 100,
        weekStart: weekStartStr,
        weekEnd: weekEndStr,
      })
    );

    // Send test email
    const resend = getResendClient();
    const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@eduskuntavahti.fi";

    await resend.emails.send({
      from: fromEmail,
      to: user.email,
      subject: `[TEST] Eduskuntavahti - Viikkoraportti ${weekStartStr} - ${weekEndStr}`,
      html: emailHtml,
    });

    return {
      success: true,
      message: `Testiraportti lähetetty osoitteeseen ${user.email}`,
    };
  } catch (error: any) {
    console.error("[sendTestReport] Error:", error);
    return {
      success: false,
      error: error.message || "Failed to send test report",
    };
  }
}

