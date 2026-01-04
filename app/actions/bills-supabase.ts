"use server";

import { createClient } from "@/lib/supabase/server";
import { getLatestBills } from "@/lib/eduskunta-api";
import { generateMockCitizenPulse, generateMockPoliticalReality } from "@/lib/bill-helpers";
import type { Bill, SupabaseBill } from "@/lib/types";
import { cache } from "react";

/**
 * Fetches bills from Supabase, or syncs from Eduskunta API if needed
 */
export const fetchBillsFromSupabase = cache(async (): Promise<Bill[]> => {
  const supabase = await createClient();

  // Try to fetch from Supabase first
  const { data: billsData, error } = await supabase
    .from("bills")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  // If we have bills in Supabase, use them
  if (billsData && billsData.length > 0 && !error) {
    return billsData.map((bill: SupabaseBill) => ({
      id: bill.id,
      title: bill.title,
      summary: bill.summary || "",
      rawText: bill.raw_text || undefined,
      parliamentId: bill.parliament_id || undefined,
      status: bill.status as Bill["status"],
      // For MVP, use mock data for citizen pulse and political reality
      // In production, these would come from actual voting data
      citizenPulse: generateMockCitizenPulse({ title: bill.title, abstract: bill.summary || "" }),
      politicalReality: generateMockPoliticalReality({ title: bill.title }),
      category: bill.category || undefined,
      publishedDate: bill.published_date || undefined,
      processingDate: (bill as any).processing_date || undefined,
      url: bill.url || undefined,
    }));
  }

  // If no bills in Supabase, try to fetch from Eduskunta API and sync
  // Note: Eduskunta API endpoint may change, so this might fail
  try {
    const eduskuntaIssues = await getLatestBills(50);
    
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
        return insertedBills.map((bill: SupabaseBill) => ({
          id: bill.id,
          title: bill.title,
          summary: bill.summary || "",
          rawText: bill.raw_text || undefined,
          parliamentId: bill.parliament_id || undefined,
          status: bill.status as Bill["status"],
          citizenPulse: generateMockCitizenPulse({ title: bill.title, abstract: bill.summary || "" }),
          politicalReality: generateMockPoliticalReality({ title: bill.title }),
          category: bill.category || undefined,
          publishedDate: bill.published_date || undefined,
          processingDate: (bill as any).processing_date || undefined,
          url: bill.url || undefined,
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

