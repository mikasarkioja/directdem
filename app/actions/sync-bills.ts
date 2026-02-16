"use server";

import { createClient } from "@/lib/supabase/server";
import { getLatestBills } from "@/lib/eduskunta-api";
import { processBillToSelkokieli } from "./process-bill";

/**
 * Force sync bills from Eduskunta API to Supabase
 * This will fetch latest bills and insert/update them in the database
 */
export async function syncBillsFromEduskunta(): Promise<{
  success: boolean;
  count: number;
  error?: string;
  warning?: string;
}> {
  const supabase = await createClient();
  return performSyncWithClient(supabase);
}

/**
 * The core sync logic that can be used with any Supabase client
 * (Useful for calling from unstable_cache where cookies() are forbidden)
 */
export async function performSyncWithClient(
  supabase: any,
): Promise<{
  success: boolean;
  count: number;
  error?: string;
  warning?: string;
}> {
  try {
    // Fetch latest bills from Eduskunta API
    const eduskuntaIssues = await getLatestBills(50);

    if (eduskuntaIssues.length === 0) {
      return {
        success: false,
        count: 0,
        error: "No bills found from Eduskunta API",
      };
    }

    // Prepare bills for insertion and deduplicate by parliament_id
    const billsMap = new Map<string, any>();

    for (const issue of eduskuntaIssues) {
      const cleanParliamentId = issue.parliamentId.split(",")[0].trim();

      if (!billsMap.has(cleanParliamentId) && cleanParliamentId) {
        billsMap.set(cleanParliamentId, {
          parliament_id: cleanParliamentId,
          title: issue.title,
          summary: issue.abstract,
          raw_text: issue.abstract,
          status:
            issue.status === "active"
              ? "voting"
              : issue.status === "pending"
                ? "draft"
                : "in_progress",
          category: issue.category || "Hallituksen esitys",
          published_date: issue.publishedDate || new Date().toISOString(),
          url: issue.url,
        });
      }
    }

    const billsToInsert = Array.from(billsMap.values());

    if (billsToInsert.length === 0) {
      return {
        success: false,
        count: 0,
        error: "No valid bills to insert after deduplication",
      };
    }

    let successCount = 0;
    const errors: string[] = [];

    for (const bill of billsToInsert) {
      const { data, error } = await supabase
        .from("bills")
        .upsert(bill, {
          onConflict: "parliament_id",
          ignoreDuplicates: false,
        })
        .select()
        .single();

      if (error) {
        errors.push(`${bill.parliament_id}: ${error.message}`);
      } else if (data) {
        successCount++;

        // Triggeri automaattiselle esianalyysille taustalla
        const isRealSummary =
          data.summary &&
          data.summary.length > 800 &&
          data.summary.includes("###");
        if (!isRealSummary) {
          processBillToSelkokieli(data.id).catch((e) =>
            console.error(`Auto-analysis failed for ${data.id}:`, e),
          );
        }
      }
    }

    return {
      success: successCount > 0,
      count: successCount,
      ...(errors.length > 0 && {
        warning: `${errors.length} bills had errors: ${errors.slice(0, 3).join(", ")}`,
      }),
    };
  } catch (error: any) {
    console.error("Failed to sync bills:", error);
    return {
      success: false,
      count: 0,
      error: error.message || "Unknown error during sync",
    };
  }
}
