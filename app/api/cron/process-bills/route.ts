import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { recordSyncAttempt, recordSyncSuccess } from "@/lib/ops/sync-logs";
import { syncExpertImpactToBillAiProfile } from "@/lib/bills/sync-expert-to-ai-profile";
import { getLatestBills } from "@/lib/eduskunta-api";
import { getBillContent } from "@/lib/eduskunta-api";
import { prepareBillTextForAI } from "@/lib/text-cleaner";
import { upsertLegislativeProjectForBill } from "@/lib/lobby/sync-legislative-projects-from-bills";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export const maxDuration = 300; // 5 minutes for processing multiple bills

/**
 * Cron: Vaski (Hallituksen esitys) → bills + legislative_projects (+ AI-yhteenveto).
 * dryRun=1: tulosta 5 ensimmäistä, ei DB-kirjoituksia (paitsi sync_logs dry_run).
 */
export async function GET(request: NextRequest) {
  let supabaseForLog: Awaited<ReturnType<typeof createAdminClient>> | null =
    null;

  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const { searchParams } = request.nextUrl;
    const dryRun =
      searchParams.get("dryRun") === "1" || searchParams.get("dry_run") === "1";
    const debug =
      searchParams.get("debug") === "1" ||
      process.env.PROCESS_BILLS_DEBUG === "1";

    supabaseForLog = await createAdminClient();

    const results = {
      billsFetched: 0,
      billsProcessed: 0,
      billsSkipped: 0,
      legislativeProjectsUpserted: 0,
      legislativeProjectErrors: [] as string[],
      errors: [] as string[],
      startTime: new Date().toISOString(),
    };

    console.log("[Cron] process-bills start", results.startTime, {
      dryRun,
      debug,
    });

    const fetchLimit = dryRun ? 5 : 5;
    const eduskuntaIssues = await getLatestBills(fetchLimit, {
      debug: !!debug,
      page: 0,
    });

    results.billsFetched = eduskuntaIssues.length;
    console.log(
      `[Cron] Vaski → mapped HE-esityksiä: ${eduskuntaIssues.length}`,
    );

    if (eduskuntaIssues.length === 0) {
      console.warn(
        "[Cron] Ei rivejä getLatestBills → tarkista Vaski-suodin / verkko",
      );
      await recordSyncSuccess(supabaseForLog, "process-bills");
      return NextResponse.json({
        success: true,
        message: "No new bills found",
        ...results,
      });
    }

    if (dryRun) {
      const sample = eduskuntaIssues.slice(0, 5);
      console.log(
        "[Cron] DRY RUN — first 5 mapped issues:",
        JSON.stringify(sample, null, 2),
      );
      await recordSyncAttempt(supabaseForLog, "process-bills", "dry_run");
      return NextResponse.json({
        success: true,
        dryRun: true,
        message: "Dry run: no database writes for bills/AI",
        sample,
        ...results,
      });
    }

    const supabase = supabaseForLog;

    const billsMap = new Map<string, Record<string, unknown>>();

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
    const insertedBillIds: string[] = [];

    for (const bill of billsToInsert) {
      const pid = String(bill.parliament_id ?? "");
      const { data, error } = await supabase
        .from("bills")
        .upsert(bill, {
          onConflict: "parliament_id",
          ignoreDuplicates: false,
        })
        .select("id, parliament_id, summary")
        .single();

      if (error) {
        const msg = `Failed to upsert ${pid}: ${error.message}`;
        results.errors.push(msg);
        console.error("[Cron] bills upsert error:", pid, error.message);
      } else if (data?.id) {
        insertedBillIds.push(data.id);
        console.log(`[Cron] bills upsert OK: ${pid} → ${data.id}`);

        const lpRes = await upsertLegislativeProjectForBill(
          supabase,
          data.id,
          data.parliament_id ?? pid,
          bill.title != null ? String(bill.title) : null,
        );
        if (lpRes.ok) {
          results.legislativeProjectsUpserted++;
          console.log(
            `[Cron] legislative_projects OK: ${lpRes.heTunnus} (bill ${data.id})`,
          );
        } else {
          const em = lpRes.error ?? "unknown";
          results.legislativeProjectErrors.push(`${pid}: ${em}`);
          console.warn(`[Cron] legislative_projects skip: ${em}`);
        }
      }
    }

    if (insertedBillIds.length === 0) {
      await recordSyncAttempt(supabase, "process-bills", "failed");
      return NextResponse.json({
        success: false,
        message: "Failed to insert any bills into database",
        ...results,
      });
    }

    console.log(`[Cron] AI phase for ${insertedBillIds.length} bill id(s)…`);

    for (const billId of insertedBillIds) {
      try {
        const { data: bill, error: billError } = await supabase
          .from("bills")
          .select("id, parliament_id, raw_text, summary")
          .eq("id", billId)
          .single();

        if (billError || !bill) {
          results.errors.push(
            `Bill ${billId} not found: ${billError?.message}`,
          );
          continue;
        }

        if (bill.summary && bill.summary.length > 200) {
          console.log(
            `[Cron] Skipping ${bill.parliament_id} - summary already exists`,
          );
          results.billsSkipped++;
          continue;
        }

        let billText = bill.raw_text;

        if (!billText || billText.length < 500) {
          console.log(
            `[Cron] Fetching full content for ${bill.parliament_id}...`,
          );
          const content = await getBillContent(bill.parliament_id);

          if (content) {
            billText = content;
            await supabase
              .from("bills")
              .update({ raw_text: billText })
              .eq("id", billId);
          } else {
            console.warn(
              `[Cron] Could not fetch full content for ${bill.parliament_id}`,
            );
            if (!billText) {
              results.errors.push(
                `No content available for ${bill.parliament_id}`,
              );
              continue;
            }
          }
        }

        const preparedText = prepareBillTextForAI(billText);

        if (preparedText.length < 100) {
          results.errors.push(
            `Text too short for ${bill.parliament_id} after processing`,
          );
          continue;
        }

        console.log(
          `[Cron] Generating AI summary for ${bill.parliament_id}...`,
        );

        if (!process.env.OPENAI_API_KEY) {
          results.errors.push(
            `OpenAI API key not configured - skipping ${bill.parliament_id}`,
          );
          console.warn(
            "[Cron] OPENAI_API_KEY not set, skipping AI summary generation",
          );
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
            model: openai("gpt-4o-mini"),
            system: systemPrompt,
            prompt: `Tiivistä tämä lakiteksti selkokielelle:\n\n${preparedText}`,
            maxTokens: 1500,
            temperature: 0.7,
          } as any);
          summary = text;
        } catch (aiError: unknown) {
          const msg =
            aiError instanceof Error ? aiError.message : String(aiError);
          results.errors.push(
            `AI generation failed for ${bill.parliament_id}: ${msg}`,
          );
          console.error(`[Cron] AI generation error:`, aiError);
          continue;
        }

        if (!summary || summary.length < 50) {
          results.errors.push(
            `Generated summary too short for ${bill.parliament_id}`,
          );
          continue;
        }

        const { error: updateError } = await supabase
          .from("bills")
          .update({
            summary: summary,
            updated_at: new Date().toISOString(),
          })
          .eq("id", billId);

        if (updateError) {
          results.errors.push(
            `Failed to save summary for ${bill.parliament_id}: ${updateError.message}`,
          );
          console.error(`[Cron] Error saving summary:`, updateError);
        } else {
          results.billsProcessed++;
          console.log(`[Cron] Successfully processed ${bill.parliament_id}`);
          try {
            await syncExpertImpactToBillAiProfile(supabase, billId, summary);
          } catch (syncErr) {
            console.warn(`[Cron] bill_ai_profiles expert sync:`, syncErr);
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error: unknown) {
        const errorMsg = `Error processing bill ${billId}: ${error instanceof Error ? error.message : error}`;
        results.errors.push(errorMsg);
        console.error(`[Cron] ${errorMsg}`, error);
      }
    }

    const endTime = new Date().toISOString();
    const duration =
      new Date(endTime).getTime() - new Date(results.startTime).getTime();

    console.log(`[Cron] Completed in ${duration}ms`);
    console.log(`[Cron] Results:`, results);

    await recordSyncSuccess(supabase, "process-bills");

    return NextResponse.json({
      success: true,
      message: `Processed ${results.billsProcessed} bills, skipped ${results.billsSkipped}`,
      ...results,
      endTime,
      durationMs: duration,
    });
  } catch (error: unknown) {
    console.error("[Cron] Fatal error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    try {
      const admin = supabaseForLog ?? (await createAdminClient());
      await recordSyncAttempt(admin, "process-bills", "failed");
    } catch {
      /* ignore */
    }
    return NextResponse.json(
      {
        success: false,
        error: msg,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
