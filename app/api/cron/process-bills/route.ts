import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getLatestBills } from "@/lib/eduskunta-api";
import { getBillContent } from "@/lib/eduskunta-api";
import { prepareBillTextForAI } from "@/lib/text-cleaner";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export const maxDuration = 300; // 5 minutes for processing multiple bills

/**
 * Cron job endpoint that runs daily at 06:00
 * Fetches the 5 latest bills, processes them through AI, and stores them
 * 
 * Protected by CRON_SECRET environment variable
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // In production, Vercel automatically adds the authorization header
      // For local testing, you can bypass this check
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    }

    const supabase = await createClient();
    const results = {
      billsFetched: 0,
      billsProcessed: 0,
      billsSkipped: 0,
      errors: [] as string[],
      startTime: new Date().toISOString(),
    };

    console.log("[Cron] Starting daily bill processing at", results.startTime);

    // 1. Fetch latest 5 bills from Eduskunta API
    console.log("[Cron] Fetching latest bills from Eduskunta API...");
    const eduskuntaIssues = await getLatestBills(5);

    if (eduskuntaIssues.length === 0) {
      console.log("[Cron] No bills found from Eduskunta API");
      return NextResponse.json({
        success: true,
        message: "No new bills found",
        ...results,
      });
    }

    results.billsFetched = eduskuntaIssues.length;
    console.log(`[Cron] Found ${eduskuntaIssues.length} bills to process`);

    // 2. Sync bills to database (upsert)
    const billsMap = new Map<string, any>();

    for (const issue of eduskuntaIssues) {
      const cleanParliamentId = issue.parliamentId.split(",")[0].trim();

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
    const insertedBillIds: string[] = [];

    // Insert/update bills in database
    for (const bill of billsToInsert) {
      const { data, error } = await supabase
        .from("bills")
        .upsert(bill, {
          onConflict: "parliament_id",
          ignoreDuplicates: false,
        })
        .select("id, parliament_id, summary")
        .single();

      if (error) {
        results.errors.push(`Failed to upsert ${bill.parliament_id}: ${error.message}`);
        console.error(`[Cron] Error upserting bill ${bill.parliament_id}:`, error);
      } else if (data) {
        insertedBillIds.push(data.id);
        console.log(`[Cron] Upserted bill: ${bill.parliament_id} (ID: ${data.id})`);
      }
    }

    if (insertedBillIds.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Failed to insert any bills into database",
        ...results,
      });
    }

    // 3. Process each bill through AI (if summary doesn't exist or is too short)
    console.log(`[Cron] Processing ${insertedBillIds.length} bills through AI...`);

    for (const billId of insertedBillIds) {
      try {
        // Check if bill already has a good summary
        const { data: bill, error: billError } = await supabase
          .from("bills")
          .select("id, parliament_id, raw_text, summary")
          .eq("id", billId)
          .single();

        if (billError || !bill) {
          results.errors.push(`Bill ${billId} not found: ${billError?.message}`);
          continue;
        }

        // Skip if summary already exists and is substantial
        if (bill.summary && bill.summary.length > 200) {
          console.log(`[Cron] Skipping ${bill.parliament_id} - summary already exists`);
          results.billsSkipped++;
          continue;
        }

        // Fetch full bill content if needed
        let billText = bill.raw_text;

        if (!billText || billText.length < 500) {
          console.log(`[Cron] Fetching full content for ${bill.parliament_id}...`);
          const content = await getBillContent(bill.parliament_id);

          if (content) {
            billText = content;
            // Update raw_text in database
            await supabase
              .from("bills")
              .update({ raw_text: billText })
              .eq("id", billId);
          } else {
            console.warn(`[Cron] Could not fetch full content for ${bill.parliament_id}`);
            // Use abstract as fallback
            if (!billText) {
              results.errors.push(`No content available for ${bill.parliament_id}`);
              continue;
            }
          }
        }

        // Prepare text for AI
        const preparedText = prepareBillTextForAI(billText);

        if (preparedText.length < 100) {
          results.errors.push(`Text too short for ${bill.parliament_id} after processing`);
          continue;
        }

        // Generate AI summary using OpenAI
        console.log(`[Cron] Generating AI summary for ${bill.parliament_id}...`);
        
        if (!process.env.OPENAI_API_KEY) {
          results.errors.push(`OpenAI API key not configured - skipping ${bill.parliament_id}`);
          console.warn("[Cron] OPENAI_API_KEY not set, skipping AI summary generation");
          continue;
        }

        const systemPrompt = `Olet puolueeton poliittinen analyytikko. Tehtäväsi on kääntää eduskunnan monimutkaiset lakitekstit selkeäksi ja ymmärrettäväksi suomeksi (selkokieli).

Säännöt:
- Vältä jargonia: Älä käytä termejä kuten 'momentti', 'lainvalmisteluasiakirja' tai 'asetuksenantovaltuutus' ilman selitystä.
- Vaikutus edellä: Kerro heti ensimmäisenä, miten tämä laki muuttaa tavallisen suomalaisen arkea.
- Puolueettomuus: Älä ota kantaa. Esitä faktat neutraalisti.
- Rakenne: Käytä aina tätä rakennetta:
  1. Mistä on kyse? (1 virke)
  2. Mikä muuttuu? (2-3 ranskaista viivaa)
  3. Vaikutus lompakkoon/arkeen: (1 virke)

Tavoite: 8-vuotiaan tai kiireisen aikuisen pitäisi ymmärtää ydinasiat 20 sekunnissa.`;

        let summary: string;
        try {
          const { text } = await generateText({
            model: openai("gpt-4o-mini"), // Type workaround for version conflict
            system: systemPrompt,
            prompt: `Tiivistä tämä lakiteksti selkokielelle:\n\n${preparedText}`,
            maxTokens: 1500,
            temperature: 0.7,
          } as any);
          summary = text;
        } catch (aiError: any) {
          results.errors.push(`AI generation failed for ${bill.parliament_id}: ${aiError.message}`);
          console.error(`[Cron] AI generation error:`, aiError);
          continue;
        }

        if (!summary || summary.length < 50) {
          results.errors.push(`Generated summary too short for ${bill.parliament_id}`);
          continue;
        }

        // Save summary to database
        const { error: updateError } = await supabase
          .from("bills")
          .update({
            summary: summary,
            updated_at: new Date().toISOString(),
          })
          .eq("id", billId);

        if (updateError) {
          results.errors.push(`Failed to save summary for ${bill.parliament_id}: ${updateError.message}`);
          console.error(`[Cron] Error saving summary:`, updateError);
        } else {
          results.billsProcessed++;
          console.log(`[Cron] Successfully processed ${bill.parliament_id}`);
        }

        // Small delay between AI calls to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error: any) {
        const errorMsg = `Error processing bill ${billId}: ${error.message}`;
        results.errors.push(errorMsg);
        console.error(`[Cron] ${errorMsg}`, error);
      }
    }

    const endTime = new Date().toISOString();
    const duration = new Date(endTime).getTime() - new Date(results.startTime).getTime();

    console.log(`[Cron] Completed in ${duration}ms`);
    console.log(`[Cron] Results:`, results);

    return NextResponse.json({
      success: true,
      message: `Processed ${results.billsProcessed} bills, skipped ${results.billsSkipped}`,
      ...results,
      endTime,
      durationMs: duration,
    });
  } catch (error: any) {
    console.error("[Cron] Fatal error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

