"use server";

import { createClient } from "@/lib/supabase/server";
import { getLatestBills } from "@/lib/eduskunta-api";
import { processBillToSelkokieli } from "./process-bill";

/**
 * Force sync bills from Eduskunta API to Supabase
 * This will fetch latest bills and insert/update them in the database
 */
export async function syncBillsFromEduskunta(): Promise<{ success: boolean; count: number; error?: string; warning?: string }> {
  const supabase = await createClient();

  try {
    // Fetch latest bills from Eduskunta API
    const eduskuntaIssues = await getLatestBills(50);
    
    if (eduskuntaIssues.length === 0) {
      return { success: false, count: 0, error: "No bills found from Eduskunta API" };
    }

    // Prepare bills for insertion and deduplicate by parliament_id
    // The API sometimes returns duplicates, so we need to filter them
    const billsMap = new Map<string, any>();
    
    for (const issue of eduskuntaIssues) {
      // Clean parliament ID (remove duplicates like "HE 196/2025 vp, HE 196/2025 vp")
      const cleanParliamentId = issue.parliamentId.split(",")[0].trim();
      
      // Only keep the first occurrence of each parliament_id
      if (!billsMap.has(cleanParliamentId) && cleanParliamentId) {
        billsMap.set(cleanParliamentId, {
          parliament_id: cleanParliamentId,
          title: issue.title,
          summary: issue.abstract,
          raw_text: issue.abstract,
          status: issue.status === "active" ? "voting" : issue.status === "pending" ? "draft" : "in_progress",
          category: issue.category || "Hallituksen esitys",
          published_date: issue.publishedDate || new Date().toISOString(),
          url: issue.url,
        });
      }
    }

    const billsToInsert = Array.from(billsMap.values());

    if (billsToInsert.length === 0) {
      return { success: false, count: 0, error: "No valid bills to insert after deduplication" };
    }

    // Use upsert to avoid duplicates (based on parliament_id)
    // Insert one at a time to avoid the "cannot affect row a second time" error
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
        
        // Triggeri automaattiselle esianalyysille taustalla (ei odoteta vastausta tässä)
        // Jos summary on jo "real", ei turhaan regeneroida
        const isRealSummary = data.summary && data.summary.length > 800 && data.summary.includes("###");
        if (!isRealSummary) {
          console.log(`[sync] Käynnistetään automaattinen analyysi lakiesitykselle: ${data.parliament_id}`);
          processBillToSelkokieli(data.id).catch(e => console.error(`Auto-analysis failed for ${data.id}:`, e));
        }
      }
    }

    if (errors.length > 0 && successCount === 0) {
      return { 
        success: false, 
        count: 0, 
        error: `Failed to insert bills: ${errors.join("; ")}` 
      };
    }

    if (successCount === 0) {
      return { success: false, count: 0, error: "No bills were inserted" };
    }

    return { 
      success: true, 
      count: successCount,
      ...(errors.length > 0 && { warning: `${errors.length} bills had errors: ${errors.slice(0, 3).join(", ")}` })
    };
  } catch (error: any) {
    console.error("Failed to sync bills:", error);
    return { 
      success: false, 
      count: 0, 
      error: error.message || "Unknown error during sync" 
    };
  }
}

