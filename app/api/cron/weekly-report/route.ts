import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 300; // 5 minutes

/**
 * Weekly report generation endpoint
 * Runs weekly (configure in vercel.json) and generates a report of citizen votes
 * ONLY from users who have opted in (join_report_list = true)
 * 
 * This report can be sent to parliament members to show citizen sentiment
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    }

    const supabase = await createClient();
    const results = {
      startTime: new Date().toISOString(),
      totalUsersInReport: 0,
      totalVotes: 0,
      billsWithVotes: 0,
      reportData: [] as any[],
    };

    console.log("[WeeklyReport] Starting weekly report generation at", results.startTime);

    // 1. Get all users who have opted in to the report list
    const { data: optedInUsers, error: usersError } = await supabase
      .from("profiles")
      .select("id")
      .eq("join_report_list", true);

    if (usersError) {
      console.error("[WeeklyReport] Error fetching opted-in users:", usersError);
      return NextResponse.json(
        { error: "Failed to fetch opted-in users", details: usersError.message },
        { status: 500 }
      );
    }

    if (!optedInUsers || optedInUsers.length === 0) {
      console.log("[WeeklyReport] No users opted in to report list");
      return NextResponse.json({
        success: true,
        message: "No users opted in to weekly reporting",
        ...results,
      });
    }

    results.totalUsersInReport = optedInUsers.length;
    const userIds = optedInUsers.map((u) => u.id);

    console.log(`[WeeklyReport] Found ${userIds.length} users opted in to reporting`);

    // 2. Get all votes from opted-in users for the past week
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
      console.error("[WeeklyReport] Error fetching votes:", votesError);
      return NextResponse.json(
        { error: "Failed to fetch votes", details: votesError.message },
        { status: 500 }
      );
    }

    if (!votes || votes.length === 0) {
      console.log("[WeeklyReport] No votes found from opted-in users in the past week");
      return NextResponse.json({
        success: true,
        message: "No votes found from opted-in users",
        ...results,
      });
    }

    results.totalVotes = votes.length;
    console.log(`[WeeklyReport] Found ${votes.length} votes from opted-in users`);

    // 3. Aggregate votes by bill
    const billVoteMap = new Map<string, {
      billId: string;
      parliamentId: string;
      title: string;
      status: string;
      for: number;
      against: number;
      neutral: number;
      total: number;
    }>();

    for (const vote of votes) {
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

    // 4. Calculate percentages and format report data
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

    results.billsWithVotes = reportData.length;
    results.reportData = reportData;

    console.log(`[WeeklyReport] Generated report for ${reportData.length} bills`);

    // 5. Optionally: Save report to database or send via email/API
    // For now, we'll just return the data
    // In production, you might want to:
    // - Save to a `weekly_reports` table
    // - Send via email to parliament members
    // - Post to an API endpoint
    // - Generate a PDF

    return NextResponse.json({
      success: true,
      message: "Weekly report generated successfully",
      ...results,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[WeeklyReport] Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate weekly report",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

