"use server";

import { createClient } from "@/lib/supabase/server";
import { getLatestBills } from "@/lib/eduskunta-api";
import { generateMockCitizenPulse, generateMockPoliticalReality } from "@/lib/bill-helpers";
import type { Bill, SupabaseBill } from "@/lib/types";
import { unstable_cache } from "next/cache";
import { cache } from "react";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Fetches bills from Supabase, or syncs from Eduskunta API if needed.
 * Wrapped in unstable_cache for performance.
 */
export async function fetchBillsFromSupabase(): Promise<Bill[]> {
  const fetcher = unstable_cache(
    async () => {
      // Use a direct Supabase client for public data fetching within cache
      // to avoid 'cookies() called within unstable_cache' error.
      const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
      const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
      
      if (!url || !key) {
        console.error("Missing Supabase credentials for bill fetcher");
        return [];
      }

      const supabase = createSupabaseClient(url, key);

      // Try to fetch from Supabase first
      const { data: billsData, error } = await supabase
        .from("bills")
        .select("id, title, summary, parliament_id, status, category, published_date, url")
        .order("published_date", { ascending: false })
        .limit(50);

      // If we have bills in Supabase, use them
      if (billsData && billsData.length > 0 && !error) {
        return billsData.map((bill: any) => ({
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

      // If no bills in Supabase, try to fetch from Eduskunta API and sync
      try {
        const eduskuntaIssues = await getLatestBills(50);
        
        if (eduskuntaIssues.length > 0) {
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

          const { data: insertedBills, error: insertError } = await supabase
            .from("bills")
            .upsert(billsToInsert, {
              onConflict: "parliament_id",
              ignoreDuplicates: false,
            })
            .select();

          if (insertedBills && !insertError) {
            return insertedBills.map((bill: any) => ({
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
        console.warn("Eduskunta API unavailable, using fallback:", error);
      }

      console.info("No bills found.");
      return [];
    },
    ["bills-feed-50"],
    { revalidate: 3600, tags: ["bills"] }
  );

  return fetcher();
}

