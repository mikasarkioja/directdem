"use server";

import { createClient } from "@/lib/supabase/server";
import { getLatestBills } from "@/lib/eduskunta-api";
import { generateMockCitizenPulse, generateMockPoliticalReality } from "@/lib/bill-helpers";

export interface Bill {
  id: string;
  title: string;
  summary: string;
  rawText?: string;
  parliamentId?: string;
  status: "draft" | "in_progress" | "voting" | "passed" | "rejected";
  citizenPulse: {
    for: number;
    against: number;
  };
  politicalReality: {
    party: string;
    position: "for" | "against" | "abstain";
    seats: number;
  }[];
}

/**
 * Fetches bills from Supabase, or syncs from Eduskunta API if needed
 */
export async function fetchBillsFromSupabase(): Promise<Bill[]> {
  const supabase = await createClient();

  // Try to fetch from Supabase first
  const { data: billsData, error } = await supabase
    .from("bills")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  // If we have bills in Supabase, use them
  if (billsData && billsData.length > 0 && !error) {
    return billsData.map((bill) => ({
      id: bill.id,
      title: bill.title,
      summary: bill.summary || "",
      rawText: bill.raw_text,
      parliamentId: bill.parliament_id,
      status: bill.status as Bill["status"],
      // For MVP, use mock data for citizen pulse and political reality
      // In production, these would come from actual voting data
      citizenPulse: generateMockCitizenPulse({ title: bill.title, abstract: bill.summary || "" }),
      politicalReality: generateMockPoliticalReality(),
    }));
  }

  // If no bills in Supabase, try to fetch from Eduskunta API and sync
  // Note: Eduskunta API endpoint may change, so this might fail
  try {
    const eduskuntaIssues = await getLatestBills(10);
    
    if (eduskuntaIssues.length > 0) {
      // Insert into Supabase
      const billsToInsert = eduskuntaIssues.map((issue) => ({
        parliament_id: issue.parliamentId,
        title: issue.title,
        summary: issue.abstract,
        raw_text: issue.abstract,
        status: issue.status === "active" ? "voting" : issue.status === "pending" ? "draft" : "in_progress",
        category: issue.category,
        published_date: issue.publishedDate || new Date().toISOString(),
        url: issue.url,
      }));

      // Use upsert to handle duplicates based on parliament_id
      const { data: insertedBills, error: insertError } = await supabase
        .from("bills")
        .upsert(billsToInsert, {
          onConflict: "parliament_id",
          ignoreDuplicates: false, // Update existing records
        })
        .select();

      if (insertedBills && !insertError) {
        return insertedBills.map((bill) => ({
          id: bill.id,
          title: bill.title,
          summary: bill.summary || "",
          rawText: bill.raw_text,
          parliamentId: bill.parliament_id,
          status: bill.status as Bill["status"],
          citizenPulse: generateMockCitizenPulse({ title: bill.title, abstract: bill.summary || "" }),
          politicalReality: generateMockPoliticalReality(),
        }));
      }
    }
  } catch (error) {
    // Eduskunta API might be unavailable or endpoint changed
    // This is not critical - we can use mock data
    console.warn("Eduskunta API unavailable, using fallback:", error);
  }

  // Fallback: Return empty array (UI will show empty state)
  // In production, you might want to seed some initial bills in Supabase
  console.info("No bills found. Consider adding bills manually to Supabase or check Eduskunta API endpoint.");
  return [];
}

