"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Check if the current user is an admin
 */
export async function checkAdminAccess(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  // Check if user has is_admin flag in profiles table
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return false;
  }

  return profile.is_admin === true;
}

/**
 * Require admin access or redirect
 */
export async function requireAdmin() {
  const isAdmin = await checkAdminAccess();
  if (!isAdmin) {
    redirect("/");
  }
}

/**
 * Get admin dashboard statistics
 */
export async function getAdminStats() {
  const supabase = await createClient();
  
  // Check admin access
  const isAdmin = await checkAdminAccess();
  if (!isAdmin) {
    throw new Error("Unauthorized");
  }

  // Get total verified users (users with email verified)
  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  // Get active bills (bills with status 'voting' or 'in_progress')
  const { count: activeBills } = await supabase
    .from("bills")
    .select("*", { count: "exact", head: true })
    .in("status", ["voting", "in_progress"]);

  // Get total votes cast
  const { count: totalVotes } = await supabase
    .from("votes")
    .select("*", { count: "exact", head: true });

  // Calculate average discrepancy gap
  // This requires getting all bills with their vote stats
  const { data: bills } = await supabase
    .from("bills")
    .select("id, title, parliament_id");

  let totalGap = 0;
  let billsWithVotes = 0;

  if (bills) {
    for (const bill of bills) {
      // Get vote stats for this bill
      const { data: voteStats } = await supabase.rpc("get_vote_stats", {
        bill_uuid: bill.id,
      });

      if (voteStats && voteStats[0] && voteStats[0].total_count > 0) {
        // Calculate discrepancy (we'll use mock political reality for now)
        // In production, this would come from actual parliament voting records
        const citizenForPercent = Number(voteStats[0].for_percent) || 0;
        const mockParliamentPercent = 65; // Mock data - replace with real data
        const gap = Math.abs(citizenForPercent - mockParliamentPercent);
        totalGap += gap;
        billsWithVotes++;
      }
    }
  }

  const avgDiscrepancyGap = billsWithVotes > 0 ? totalGap / billsWithVotes : 0;

  return {
    totalUsers: totalUsers || 0,
    activeBills: activeBills || 0,
    totalVotes: totalVotes || 0,
    avgDiscrepancyGap: Math.round(avgDiscrepancyGap * 10) / 10,
  };
}

/**
 * Get bills with discrepancy gap data for the deficit table
 */
export async function getBillsWithGap() {
  const supabase = await createClient();
  
  const isAdmin = await checkAdminAccess();
  if (!isAdmin) {
    throw new Error("Unauthorized");
  }

  const { data: bills } = await supabase
    .from("bills")
    .select("id, title, parliament_id, status")
    .order("created_at", { ascending: false });

  if (!bills) {
    return [];
  }

  const billsWithGap = await Promise.all(
    bills.map(async (bill) => {
      // Get vote stats
      const { data: voteStats } = await supabase.rpc("get_vote_stats", {
        bill_uuid: bill.id,
      });

      const citizenForPercent = voteStats?.[0]?.for_percent
        ? Number(voteStats[0].for_percent)
        : 0;
      
      // Mock parliament stance (replace with real data)
      const parliamentForPercent = 65;
      const gap = Math.abs(citizenForPercent - parliamentForPercent);

      return {
        id: bill.id,
        title: bill.title,
        parliamentId: bill.parliament_id,
        parliamentStance: parliamentForPercent,
        citizenStance: citizenForPercent,
        gap: Math.round(gap * 10) / 10,
        isHighGap: gap > 20,
      };
    })
  );

  // Sort by gap (highest first)
  return billsWithGap.sort((a, b) => b.gap - a.gap);
}

/**
 * Get votes per day for the last 14 days
 */
export async function getVotesPerDay() {
  const supabase = await createClient();
  
  const isAdmin = await checkAdminAccess();
  if (!isAdmin) {
    throw new Error("Unauthorized");
  }

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const { data: votes } = await supabase
    .from("votes")
    .select("created_at")
    .gte("created_at", fourteenDaysAgo.toISOString())
    .order("created_at", { ascending: true });

  if (!votes) {
    return [];
  }

  // Group votes by date
  const votesByDate = new Map<string, number>();

  // Initialize all dates in the last 14 days with 0
  for (let i = 13; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    votesByDate.set(dateStr, 0);
  }

  // Count votes per day
  votes.forEach((vote) => {
    const dateStr = vote.created_at.split("T")[0];
    const currentCount = votesByDate.get(dateStr) || 0;
    votesByDate.set(dateStr, currentCount + 1);
  });

  // Convert to array format for chart
  return Array.from(votesByDate.entries())
    .map(([date, count]) => ({
      date: new Date(date).toLocaleDateString("fi-FI", {
        month: "short",
        day: "numeric",
      }),
      votes: count,
      fullDate: date,
    }))
    .sort((a, b) => a.fullDate.localeCompare(b.fullDate));
}

