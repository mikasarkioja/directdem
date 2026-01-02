"use server";

import { createClient } from "@/lib/supabase/server";
import { getBillContent } from "@/lib/eduskunta-api";
import { generateCitizenSummary } from "@/lib/ai-summary";
import { prepareBillTextForAI } from "@/lib/text-cleaner";
import { parseSummary } from "@/lib/summary-parser";
import type { Bill } from "@/lib/types";

/**
 * Processes a bill to generate a citizen-friendly summary (selkokieli)
 * 
 * This function:
 * 1. Checks if summary already exists in database
 * 2. Fetches full bill text from Eduskunta API if needed
 * 3. Generates AI summary using the citizen-friendly prompt
 * 4. Saves the summary back to the database
 * 
 * @param billId - The UUID of the bill in our database
 * @returns Object with success status and summary data
 */
async function processBillToSelkokieliInternal(
  billId: string,
  forceRegenerate: boolean
): Promise<{
  success: boolean;
  summary?: string;
  parsedSummary?: {
    topic: string;
    changes: string[];
    impact: string;
  };
  error?: string;
  fromCache?: boolean;
}> {
  console.log(`[processBillToSelkokieli] Function called with billId: ${billId}, forceRegenerate: ${forceRegenerate}`);
  const supabase = await createClient();
  console.log(`[processBillToSelkokieli] Supabase client created`);

  try {
    console.log(`[processBillToSelkokieli] Step 1: Checking if bill exists...`);
    // 1. Check if bill exists and if summary already exists
    const { data: bill, error: billError } = await supabase
      .from("bills")
      .select("id, parliament_id, raw_text, summary")
      .eq("id", billId)
      .single();
    
    console.log(`[processBillToSelkokieli] Bill query result:`, { 
      hasBill: !!bill, 
      error: billError?.message,
      parliamentId: bill?.parliament_id 
    });

    if (billError || !bill) {
      return {
        success: false,
        error: `Bill not found: ${billError?.message || "Unknown error"}`,
      };
    }

    // 2. Check if we already have a summary (unless force regenerate is requested)
    console.log(`[processBillToSelkokieli] Step 2: Checking if summary exists...`);
    console.log(`[processBillToSelkokieli] Bill summary length: ${bill.summary?.length || 0}, forceRegenerate: ${forceRegenerate}`);
    
    // Check if it's a "real" AI summary (usually contains markdown headers and is long)
    const isRealSummary = bill.summary && bill.summary.length > 800 && bill.summary.includes("###");
    
    if (!forceRegenerate && isRealSummary) {
      console.log(`[processBillToSelkokieli] Found existing substantial summary (${bill.summary.length} chars), using cached version`);
      // Try to parse existing summary
      try {
        const parsed = parseSummary(bill.summary);
        console.log(`[processBillToSelkokieli] Successfully parsed existing summary, returning from cache`);
        return {
          success: true,
          summary: bill.summary,
          parsedSummary: parsed,
          fromCache: true,
        };
      } catch (parseError: any) {
        console.warn(`[processBillToSelkokieli] Failed to parse existing summary, will regenerate:`, parseError.message);
        // If parsing fails, continue to regenerate
      }
    } else {
      if (forceRegenerate) {
        console.log(`[processBillToSelkokieli] Force regenerate requested, ignoring existing summary`);
      } else {
        console.log(`[processBillToSelkokieli] No existing summary found (or too short), proceeding to fetch and generate...`);
      }
    }

    // 3. Fetch full bill content if we don't have raw_text or it's too short
    console.log(`[processBillToSelkokieli] Step 3: Checking if we need to fetch content...`);
    let billText = bill.raw_text;
    console.log(`[processBillToSelkokieli] Current raw_text length: ${billText?.length || 0}`);

    if (!billText || billText.length < 500) {
      console.log(`[processBillToSelkokieli] Need to fetch content (raw_text missing or too short)`);
      // Try to fetch from Eduskunta API
      // First, try to get the bill URL from the database
      console.log(`[processBillToSelkokieli] Fetching bill URL from database...`);
      const { data: billWithUrl, error: urlError } = await supabase
        .from("bills")
        .select("url, parliament_id, summary")
        .eq("id", billId)
        .single();
      
      console.log(`[processBillToSelkokieli] Bill URL query result:`, { 
        hasUrl: !!billWithUrl?.url, 
        url: billWithUrl?.url,
        parliamentId: billWithUrl?.parliament_id,
        urlError: urlError?.message 
      });

      // Try fetching using the URL if available, otherwise use parliament_id
      const fetchTarget = billWithUrl?.url || bill.parliament_id;
      console.log(`[processBillToSelkokieli] Attempting to fetch content for ${bill.parliament_id}${billWithUrl?.url ? ` using URL: ${billWithUrl.url}` : ""}`);
      
      try {
        console.log(`[processBillToSelkokieli] Fetching content for: ${fetchTarget}`);
        console.log(`[processBillToSelkokieli] Note: Large PDFs may take 30-60 seconds to extract...`);
        const content = await getBillContent(fetchTarget);
        console.log(`[processBillToSelkokieli] getBillContent returned: ${content ? `${content.length} characters` : "null"}`);
        
        if (content) {
          // Log first 200 chars to see what we got
          console.log(`[processBillToSelkokieli] Content preview (first 200 chars): ${content.substring(0, 200)}`);
        } else {
          console.warn(`[processBillToSelkokieli] getBillContent returned null - PDF extraction may have failed or timed out`);
        }

        if (!content || content.length < 100) {
          console.warn(`[processBillToSelkokieli] getBillContent returned ${content ? content.length : 0} characters for ${bill.parliament_id} - too short or null`);
          
          // If force regenerate, don't use existing summary as fallback - we need fresh content
          if (forceRegenerate) {
            return {
              success: false,
              error: `Could not fetch full bill content for ${bill.parliament_id}. Fetched ${content ? content.length : 0} characters, which is too short. The full document may not be available in the Eduskunta API yet. Try the test page at /test-bill-fetch to verify the document is accessible.`,
            };
          }
          
          // Try to get the bill from the database to see if we have any text
          const { data: billData } = await supabase
            .from("bills")
            .select("summary, raw_text")
            .eq("id", billId)
            .single();
          
          // If we can't fetch full content, try to use the summary/abstract we have
          // This allows AI to still generate a summary from the available text
          const fallbackText = billData?.summary || billWithUrl?.summary || bill.summary;
          if (fallbackText && fallbackText.length > 200 && fallbackText.length < 50000) {
            console.log(`[processBillToSelkokieli] Using existing summary as fallback for ${bill.parliament_id}`);
            billText = fallbackText;
          } else {
            // Provide more helpful error message
            const errorDetails = content 
              ? `Fetched ${content.length} characters, which is too short.`
              : `Could not fetch any content from the API.`;
            
            return {
              success: false,
              error: `Could not fetch bill content for ${bill.parliament_id}. ${errorDetails} The full document may not be available in the Eduskunta API yet. The bill may be too new or the API endpoint may have changed. You can try again later, or test the document at /test-bill-fetch to verify accessibility.`,
            };
          }
        } else {
          billText = content;
          console.log(`[processBillToSelkokieli] Successfully fetched ${content.length} characters of content for ${bill.parliament_id}`);
        }
      } catch (fetchError: any) {
        console.error(`[processBillToSelkokieli] Error fetching content:`, fetchError);
        console.error(`[processBillToSelkokieli] Error stack:`, fetchError.stack);
        
        // If force regenerate, don't use existing summary as fallback - we need fresh content
        if (forceRegenerate) {
          return {
            success: false,
            error: `Failed to fetch bill content: ${fetchError.message || "Unknown error"}. Check the server logs for more details. You can also test the fetch at /test-bill-fetch.`,
          };
        }
        
        // Try fallback (only if not force regenerating)
        const fallbackText = billWithUrl?.summary || bill.summary;
        if (fallbackText && fallbackText.length > 200) {
          console.log(`[processBillToSelkokieli] Using existing summary as fallback after fetch error`);
          billText = fallbackText;
        } else {
          return {
            success: false,
            error: `Failed to fetch bill content: ${fetchError.message || "Unknown error"}. Check the server logs for more details. You can also test the fetch at /test-bill-fetch.`,
          };
        }
      }
    }

    // 4. Prepare text for AI processing (clean, extract sections, truncate if needed)
    console.log(`[processBillToSelkokieli] Original billText length: ${billText?.length || 0}`);
    const preparedText = prepareBillTextForAI(billText);
    console.log(`[processBillToSelkokieli] Prepared text length: ${preparedText.length}`);

    if (preparedText.length < 100) {
      // Try using raw text directly if prepared text is too short
      console.warn(`[processBillToSelkokieli] Prepared text too short (${preparedText.length}), trying raw text...`);
      
      // Clean raw text as fallback (strip HTML tags and clean whitespace)
      const cleanedRawText = billText
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, " ")
        .trim();
      console.log(`[processBillToSelkokieli] Cleaned raw text length: ${cleanedRawText.length}`);
      
      if (cleanedRawText.length >= 100) {
        // Use cleaned raw text as fallback
        const summary = await generateCitizenSummary(cleanedRawText.substring(0, 20000));
        
        if (!summary || summary.length < 50) {
          return {
            success: false,
            error: `Failed to generate summary from cleaned text. Original text was ${billText.length} chars, cleaned to ${cleanedRawText.length} chars, but AI returned empty result.`,
          };
        }
        
        // Clean the summary: remove null bytes and other problematic characters
        const cleanedSummary = summary
          .replace(/\u0000/g, '') // Remove null bytes
          .replace(/[\u0001-\u0008\u000B-\u001F\u007F-\u009F]/g, '') // Remove control characters
          .trim();
        
        // Clean raw_text too
        const cleanedBillTextForFallback = billText
          .replace(/\u0000/g, '')
          .replace(/[\u0001-\u001F\u007F-\u009F]/g, '')
          .trim();
        
        // Save the summary
        const parsedSummary = parseSummary(cleanedSummary);
        const { error: updateError } = await supabase
          .from("bills")
          .update({
            summary: cleanedSummary,
            raw_text: cleanedBillTextForFallback,
            updated_at: new Date().toISOString(),
          })
          .eq("id", billId);
        
        if (updateError) {
          console.error("Failed to save summary to database:", updateError);
          return {
            success: true,
            summary: cleanedSummary,
            parsedSummary,
            error: `Summary generated but failed to save: ${updateError.message}`,
          };
        }
        
        return {
          success: true,
          summary: cleanedSummary,
          parsedSummary,
          fromCache: false,
        };
      }
      
      return {
        success: false,
        error: `Bill text is too short after processing. Original: ${billText.length} chars, Prepared: ${preparedText.length} chars, Cleaned raw: ${cleanedRawText.length} chars. The document might be mostly formatting/HTML without substantial text content.`,
      };
    }

    // 5. Generate AI summary
    console.log(`[processBillToSelkokieli] Generating AI summary for ${preparedText.length} characters of prepared text...`);
    
    let summary: string;
    try {
      summary = await generateCitizenSummary(preparedText);
      console.log(`[processBillToSelkokieli] AI summary generated: ${summary.length} characters`);
    } catch (aiError: any) {
      // If it's a quota error, return a clear error message
      if (aiError.message?.includes("quota") || aiError.message?.includes("insufficient_quota")) {
        console.error(`[processBillToSelkokieli] OpenAI quota error: ${aiError.message}`);
        return {
          success: false,
          error: `OpenAI API quota exceeded. Please check your OpenAI account billing and quota at https://platform.openai.com/account/billing. You may need to add payment information or upgrade your plan.`,
        };
      }
      // Re-throw other errors
      throw aiError;
    }

    if (!summary || summary.length < 50) {
      return {
        success: false,
        error: "Failed to generate summary. AI returned empty or invalid result.",
      };
    }

    // Clean the summary: remove null bytes and other problematic characters that PostgreSQL can't store
    const cleanedSummary = summary
      .replace(/\u0000/g, '') // Remove null bytes
      .replace(/\u0001-\u0008/g, '') // Remove other control characters
      .replace(/\u000B-\u001F/g, '') // Remove more control characters
      .replace(/\u007F-\u009F/g, '') // Remove DEL and other control characters
      .trim();
    
    console.log(`[processBillToSelkokieli] Cleaned summary: ${cleanedSummary.length} characters (removed ${summary.length - cleanedSummary.length} problematic characters)`);

    // 6. Parse the summary into structured format
    const parsedSummary = parseSummary(cleanedSummary);

    // 7. Save to database
    // Update both raw_text (if it was fetched) and summary
    // Also clean raw_text if we're saving it
    const cleanedBillText = billText 
      ? billText.replace(/\u0000/g, '').replace(/\u0001-\u001F/g, '').trim()
      : null;
    
    const updateData: any = {
      summary: cleanedSummary,
      updated_at: new Date().toISOString(),
    };

    // Only update raw_text if we fetched new content (and clean it)
    if (cleanedBillText && cleanedBillText !== bill.raw_text) {
      updateData.raw_text = cleanedBillText;
    }

    console.log(`[processBillToSelkokieli] Saving summary to database for bill ${billId}...`);
    const { error: updateError } = await supabase
      .from("bills")
      .update(updateData)
      .eq("id", billId);

    if (updateError) {
      console.error("[processBillToSelkokieli] Failed to save summary to database:", updateError);
      // Still return success since we generated the summary
      return {
        success: true,
        summary,
        parsedSummary,
        error: `Summary generated but failed to save: ${updateError.message}`,
      };
    }

    console.log(`[processBillToSelkokieli] Summary saved successfully! Summary length: ${summary.length} chars`);
    
    return {
      success: true,
      summary,
      parsedSummary,
      fromCache: false,
    };
  } catch (error: any) {
    console.error("Failed to process bill:", error);
    return {
      success: false,
      error: error.message || "Unknown error during bill processing",
    };
  }
}

/**
 * Public server action: Process bill (uses cache if available)
 */
export async function processBillToSelkokieli(billId: string): Promise<{
  success: boolean;
  summary?: string;
  parsedSummary?: {
    topic: string;
    changes: string[];
    impact: string;
  };
  error?: string;
  fromCache?: boolean;
}> {
  return processBillToSelkokieliInternal(billId, false);
}

/**
 * Public server action: Force regenerate summary (ignores cache)
 */
export async function regenerateBillSummary(billId: string): Promise<{
  success: boolean;
  summary?: string;
  parsedSummary?: {
    topic: string;
    changes: string[];
    impact: string;
  };
  error?: string;
  fromCache?: boolean;
}> {
  return processBillToSelkokieliInternal(billId, true);
}

