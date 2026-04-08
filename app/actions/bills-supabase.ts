"use server";

import { createClient } from "@/lib/supabase/server";
import { getLatestBills } from "@/lib/eduskunta-api";
import { performSyncWithClient } from "./sync-bills";
import { emptyPoliticalReality } from "@/lib/bill-helpers";
import { rowsToAggregate } from "@/lib/citizen-reactions/aggregate";
import type { Bill, SupabaseBill } from "@/lib/types";
import { unstable_cache } from "next/cache";
import { cache } from "react";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

async function fetchCitizenPulsePercentMap(
  supabase: SupabaseClient,
  billIds: string[],
): Promise<Map<string, { forP: number; againstP: number }>> {
  const map = new Map<string, { forP: number; againstP: number }>();
  if (!billIds.length) return map;
  try {
    const { data, error } = await supabase
      .from("citizen_reactions")
      .select("bill_id, reaction_type")
      .in("bill_id", billIds);
    if (error || !data?.length) return map;
    const byBill = new Map<string, { reaction_type: string }[]>();
    for (const row of data as { bill_id: string; reaction_type: string }[]) {
      const bid = row.bill_id;
      if (!byBill.has(bid)) byBill.set(bid, []);
      byBill.get(bid)!.push(row);
    }
    for (const [bid, rows] of byBill) {
      const agg = rowsToAggregate(rows);
      if (agg.forPercent == null) continue;
      const forP = Math.min(100, Math.max(0, Math.round(agg.forPercent)));
      map.set(bid, { forP, againstP: 100 - forP });
    }
  } catch {
    /* taulu puuttuu tai RLS */
  }
  return map;
}

function mapBillRow(
  bill: any,
  pulseMap: Map<string, { forP: number; againstP: number }>,
): Bill {
  const dbPulse = pulseMap.get(bill.id);
  const citizenPulse = dbPulse
    ? { for: dbPulse.forP, against: dbPulse.againstP }
    : null;
  const citizenPulseSource = dbPulse ? "community" : "none";

  return {
    id: bill.id,
    title: bill.title,
    summary: bill.summary || "",
    rawText: bill.raw_text || undefined,
    parliamentId: bill.parliament_id || undefined,
    status: bill.status as Bill["status"],
    citizenPulse,
    citizenPulseSource,
    politicalReality: emptyPoliticalReality(),
    category: bill.category || undefined,
    publishedDate: bill.published_date || undefined,
    processingDate: bill.processing_date || undefined,
    url: bill.url || undefined,
  };
}

/**
 * Fetches bills from Supabase, or syncs from Eduskunta API if needed.
 * Wrapped in unstable_cache for performance.
 */
export async function fetchBillsFromSupabase(): Promise<Bill[]> {
  const fetcher = unstable_cache(
    async () => {
      // Use a direct Supabase client for public data fetching within cache
      // to avoid 'cookies() called within unstable_cache' error.
      const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
      const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

      if (!url || !key) {
        console.error("Missing Supabase credentials for bill fetcher");
        return [];
      }

      const supabase = createSupabaseClient(url, key);

      // Proactively sync from Eduskunta to ensure fresh data in Supabase
      // This is triggered whenever the unstable_cache revalidates (900s)
      try {
        await performSyncWithClient(supabase);
      } catch (e) {
        console.warn("[fetchBillsFromSupabase] Proactive sync failed:", e);
      }

      // Try to fetch from Supabase first
      const { data: billsData, error } = await supabase
        .from("bills")
        .select(
          "id, title, summary, parliament_id, status, category, published_date, url",
        )
        .order("published_date", { ascending: false })
        .limit(50);

      // If we have bills in Supabase, use them
      if (billsData && billsData.length > 0 && !error) {
        const ids = (billsData as { id: string }[]).map((b) => b.id);
        const pulseMap = await fetchCitizenPulsePercentMap(supabase, ids);
        return (billsData as any[]).map((bill) => mapBillRow(bill, pulseMap));
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
            status:
              issue.status === "active"
                ? "voting"
                : issue.status === "pending"
                  ? "draft"
                  : "in_progress",
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
            const ids = (insertedBills as { id: string }[]).map((b) => b.id);
            const pulseMap = await fetchCitizenPulsePercentMap(supabase, ids);
            return (insertedBills as any[]).map((bill) =>
              mapBillRow(bill, pulseMap),
            );
          }
        }
      } catch (error) {
        console.warn("Eduskunta API unavailable, using fallback:", error);
      }

      console.info("No bills found.");
      return [];
    },
    ["bills-feed-50"],
    { revalidate: 900, tags: ["bills"] },
  );

  return fetcher();
}
