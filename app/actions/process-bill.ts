"use server";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getBillContent } from "@/lib/eduskunta-api";
import { generateCitizenSummary } from "@/lib/ai-summary";
import { prepareBillTextForAI } from "@/lib/text-cleaner";
import { parseSummary } from "@/lib/summary-parser";
import { trackFeatureUsage, logAiCost } from "@/lib/analytics/tracker";
import { syncExpertImpactToBillAiProfile } from "@/lib/bills/sync-expert-to-ai-profile";
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
  forceRegenerate: boolean,
  providedSupabase?: any,
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
  console.log(
    `[processBillToSelkokieli] Function called with billId: ${billId}, forceRegenerate: ${forceRegenerate}`,
  );
  const supabase = providedSupabase || (await createClient());

  // Track usage
  await trackFeatureUsage("Bill Analysis", "GENERATE");
  console.log(`[processBillToSelkokieli] Supabase client created`);

  try {
    console.log(`[processBillToSelkokieli] Step 1: Checking if bill exists...`);
    // 1. Check if bill exists and if summary already exists
    const { data: bill, error: billError } = await supabase
      .from("bills")
      .select("id, parliament_id, raw_text, summary, title")
      .eq("id", billId)
      .single();

    console.log(`[processBillToSelkokieli] Bill query result:`, {
      hasBill: !!bill,
      error: billError?.message,
      parliamentId: bill?.parliament_id,
    });

    if (billError || !bill) {
      return {
        success: false,
        error: `Bill not found: ${billError?.message || "Unknown error"}`,
      };
    }

    // 2. Check if we already have a summary (unless force regenerate is requested)
    console.log(
      `[processBillToSelkokieli] Step 2: Checking if summary exists...`,
    );
    console.log(
      `[processBillToSelkokieli] Bill summary length: ${bill.summary?.length || 0}, forceRegenerate: ${forceRegenerate}`,
    );

    // Check if it's a "real" AI summary (usually contains markdown headers and is long)
    const isRealSummary =
      bill.summary && bill.summary.length > 800 && bill.summary.includes("###");

    if (!forceRegenerate && isRealSummary) {
      console.log(
        `[processBillToSelkokieli] Found existing substantial summary (${bill.summary.length} chars), using cached version`,
      );
      // Try to parse existing summary
      try {
        const parsed = parseSummary(bill.summary);
        console.log(
          `[processBillToSelkokieli] Successfully parsed existing summary, returning from cache`,
        );
        try {
          const admin = await createAdminClient();
          await syncExpertImpactToBillAiProfile(admin, billId, bill.summary);
        } catch (e) {
          console.warn(
            "[processBillToSelkokieli] expert_impact_assessment sync (cache):",
            e,
          );
        }
        return {
          success: true,
          summary: bill.summary,
          parsedSummary: parsed,
          fromCache: true,
        };
      } catch (parseError: any) {
        console.warn(
          `[processBillToSelkokieli] Failed to parse existing summary, will regenerate:`,
          parseError.message,
        );
        // If parsing fails, continue to regenerate
      }
    } else {
      if (forceRegenerate) {
        console.log(
          `[processBillToSelkokieli] Force regenerate requested, ignoring existing summary`,
        );
      } else {
        console.log(
          `[processBillToSelkokieli] No existing summary found (or too short), proceeding to fetch and generate...`,
        );
      }
    }

    // 3. Fetch full bill content if we don't have raw_text or it's too short
    console.log(
      `[processBillToSelkokieli] Step 3: Checking if we need to fetch content...`,
    );
    let billText = bill.raw_text;
    console.log(
      `[processBillToSelkokieli] Current raw_text length: ${billText?.length || 0}`,
    );

    if (!billText || billText.length < 500) {
      console.log(
        `[processBillToSelkokieli] Need to fetch content (raw_text missing or too short)`,
      );
      // Try to fetch from Eduskunta API
      // First, try to get the bill URL from the database
      console.log(
        `[processBillToSelkokieli] Fetching bill URL from database...`,
      );
      const { data: billWithUrl, error: urlError } = await supabase
        .from("bills")
        .select("url, parliament_id, summary")
        .eq("id", billId)
        .single();

      console.log(`[processBillToSelkokieli] Bill URL query result:`, {
        hasUrl: !!billWithUrl?.url,
        url: billWithUrl?.url,
        parliamentId: billWithUrl?.parliament_id,
        urlError: urlError?.message,
      });

      // Try fetching using the URL if available, otherwise use parliament_id
      const fetchTarget = billWithUrl?.url || bill.parliament_id;
      console.log(
        `[processBillToSelkokieli] Attempting to fetch content for ${bill.parliament_id}${billWithUrl?.url ? ` using URL: ${billWithUrl.url}` : ""}`,
      );

      try {
        console.log(
          `[processBillToSelkokieli] Fetching content for: ${fetchTarget}`,
        );
        console.log(
          `[processBillToSelkokieli] Note: Large PDFs may take 30-60 seconds to extract...`,
        );
        const content = await getBillContent(fetchTarget);
        console.log(
          `[processBillToSelkokieli] getBillContent returned: ${content ? `${content.length} characters` : "null"}`,
        );

        if (content) {
          // Log first 200 chars to see what we got
          console.log(
            `[processBillToSelkokieli] Content preview (first 200 chars): ${content.substring(0, 200)}`,
          );
        } else {
          console.warn(
            `[processBillToSelkokieli] getBillContent returned null - PDF extraction may have failed or timed out`,
          );
        }

        if (!content || content.length < 100) {
          console.warn(
            `[processBillToSelkokieli] getBillContent returned ${content ? content.length : 0} characters for ${bill.parliament_id} - too short or null`,
          );

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
          const fallbackText =
            billData?.summary || billWithUrl?.summary || bill.summary;
          if (
            fallbackText &&
            fallbackText.length > 200 &&
            fallbackText.length < 50000
          ) {
            console.log(
              `[processBillToSelkokieli] Using existing summary as fallback for ${bill.parliament_id}`,
            );
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
          console.log(
            `[processBillToSelkokieli] Successfully fetched ${content.length} characters of content for ${bill.parliament_id}`,
          );
        }
      } catch (fetchError: any) {
        console.error(
          `[processBillToSelkokieli] Error fetching content:`,
          fetchError,
        );
        console.error(
          `[processBillToSelkokieli] Error stack:`,
          fetchError.stack,
        );

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
          console.log(
            `[processBillToSelkokieli] Using existing summary as fallback after fetch error`,
          );
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
    console.log(
      `[processBillToSelkokieli] Original billText length: ${billText?.length || 0}`,
    );
    const preparedText = prepareBillTextForAI(billText);
    console.log(
      `[processBillToSelkokieli] Prepared text length: ${preparedText.length}`,
    );

    if (preparedText.length < 100) {
      // Try using raw text directly if prepared text is too short
      console.warn(
        `[processBillToSelkokieli] Prepared text too short (${preparedText.length}), trying raw text...`,
      );

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
      console.log(
        `[processBillToSelkokieli] Cleaned raw text length: ${cleanedRawText.length}`,
      );

      if (cleanedRawText.length >= 100) {
        // Use cleaned raw text as fallback
        const summary = await generateCitizenSummary(
          cleanedRawText.substring(0, 20000),
          "parliament",
        );

        if (!summary || summary.length < 50) {
          return {
            success: false,
            error: `Failed to generate summary from cleaned text. Original text was ${billText.length} chars, cleaned to ${cleanedRawText.length} chars, but AI returned empty result.`,
          };
        }

        // Clean the summary: remove null bytes and other problematic characters
        const cleanedSummary = summary
          .replace(/\u0000/g, "") // Remove null bytes
          .replace(/[\u0001-\u0008\u000B-\u001F\u007F-\u009F]/g, "") // Remove control characters
          .trim();

        // Clean raw_text too
        const cleanedBillTextForFallback = billText
          .replace(/\u0000/g, "")
          .replace(/[\u0001-\u001F\u007F-\u009F]/g, "")
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

        try {
          const admin = await createAdminClient();
          await syncExpertImpactToBillAiProfile(admin, billId, cleanedSummary);
        } catch (e) {
          console.warn(
            "[processBillToSelkokieli] expert_impact_assessment sync:",
            e,
          );
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

    // 5. Generate AI summary (Integrated Deep Analysis)
    console.log(
      `[processBillToSelkokieli] Generating deep AI summary for ${preparedText.length} characters of prepared text...`,
    );

    let summary: string;
    try {
      // Käytetään nyt aina gpt-4o:ta ja laajaa promptia
      summary = await generateCitizenSummary(preparedText, "parliament");
      console.log(
        `[processBillToSelkokieli] Deep AI summary generated: ${summary.length} characters`,
      );

      // HAETAAN SYVÄANALYYSI TIEDOT erilliseen tauluun jos mahdollista
      try {
        const { generateText } = await import("ai");
        const { openai } = await import("@ai-sdk/openai");

        const { text: deepJson, usage: deepUsage } = await generateText({
          model: openai("gpt-4o") as any,
          system: `Olet valtiontalouden ja poliittisen analyysin asiantuntija. Pura tämä lakiesitys JSON-muotoon syväanalyysia varten.`,
          prompt: `Analysoi tämä laki: ${summary.substring(0, 5000)}\n\nPalauta JSON: {
            "economic_impact": { "total_cost_estimate": 0, "budget_alignment": "string", "funding_source": "string" },
            "strategic_analysis": { "primary_driver": "string", "strategy_match_score": 85 },
            "social_equity": { "winners": [], "losers": [] },
            "pro_arguments": ["argumentti 1", "argumentti 2"],
            "con_arguments": ["argumentti 1", "argumentti 2"],
            "friction_index": 50
          }`,
        });

        // Log AI Cost for Deep Analysis
        await logAiCost(
          "Bill Deep Analysis",
          "gpt-4o",
          deepUsage.promptTokens,
          deepUsage.completionTokens,
        );

        const deepData = JSON.parse(
          deepJson
            .replace(/```json\n?/, "")
            .replace(/\n?```/, "")
            .trim(),
        );

        // Tallennetaan tehostettuun profiiliin
        await supabase.from("bill_enhanced_profiles").upsert(
          {
            bill_id: bill.parliament_id || billId,
            title: bill.parliament_id || "Laki",
            analysis_data: { analysis_depth: deepData },
            forecast_metrics: { friction_index: deepData.friction_index },
          },
          { onConflict: "bill_id" },
        );

        // TÄRKEÄÄ: Käynnistetään Takinkääntö-vahti
        const { detectFlipsWithAI } = await import("@/lib/actions/flip-watch");
        await detectFlipsWithAI({
          billId: billId,
          billTitle: bill.title,
          deepAnalysis: deepData,
          context: "parliament",
        });
      } catch (deepErr) {
        console.error(
          "Failed to store deep metadata for bill or detect flips, but summary is OK",
        );
      }
    } catch (aiError: any) {
      // If it's a quota error, return a clear error message
      if (
        aiError.message?.includes("quota") ||
        aiError.message?.includes("insufficient_quota")
      ) {
        console.error(
          `[processBillToSelkokieli] OpenAI quota error: ${aiError.message}`,
        );
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
        error:
          "Failed to generate summary. AI returned empty or invalid result.",
      };
    }

    // Clean the summary: remove null bytes and other problematic characters that PostgreSQL can't store
    const cleanedSummary = summary
      .replace(/\u0000/g, "") // Remove null bytes
      .replace(/\u0001-\u0008/g, "") // Remove other control characters
      .replace(/\u000B-\u001F/g, "") // Remove more control characters
      .replace(/\u007F-\u009F/g, "") // Remove DEL and other control characters
      .trim();

    console.log(
      `[processBillToSelkokieli] Cleaned summary: ${cleanedSummary.length} characters (removed ${summary.length - cleanedSummary.length} problematic characters)`,
    );

    // 6. Parse the summary into structured format
    const parsedSummary = parseSummary(cleanedSummary);

    // 7. Save to database
    // Update both raw_text (if it was fetched) and summary
    // Also clean raw_text if we're saving it
    const cleanedBillText = billText
      ? billText
          .replace(/\u0000/g, "")
          .replace(/\u0001-\u001F/g, "")
          .trim()
      : null;

    const updateData: any = {
      summary: cleanedSummary,
      updated_at: new Date().toISOString(),
    };

    // Only update raw_text if we fetched new content (and clean it)
    if (cleanedBillText && cleanedBillText !== bill.raw_text) {
      updateData.raw_text = cleanedBillText;
    }

    console.log(
      `[processBillToSelkokieli] Saving summary to database for bill ${billId}...`,
    );
    const { error: updateError } = await supabase
      .from("bills")
      .update(updateData)
      .eq("id", billId);

    if (updateError) {
      console.error(
        "[processBillToSelkokieli] Failed to save summary to database:",
        updateError,
      );
      // Still return success since we generated the summary
      return {
        success: true,
        summary,
        parsedSummary,
        error: `Summary generated but failed to save: ${updateError.message}`,
      };
    }

    console.log(
      `[processBillToSelkokieli] Summary saved successfully! Summary length: ${summary.length} chars`,
    );

    try {
      const admin = await createAdminClient();
      await syncExpertImpactToBillAiProfile(admin, billId, cleanedSummary);
    } catch (e) {
      console.warn(
        "[processBillToSelkokieli] expert_impact_assessment sync (main path):",
        e,
      );
    }

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
 * Generate and store long-form syväanalyysi (~25k chars, incl. expert rationale + stakeholders) in bill_ai_profiles.deep_analysis.
 */
export async function generateBillDeepAnalysis(billId: string): Promise<{
  success: boolean;
  error?: string;
  chars?: number;
}> {
  if (!billId?.trim()) {
    return { success: false, error: "billId puuttuu." };
  }

  const admin = await createAdminClient();

  const { data: bill, error: billError } = await admin
    .from("bills")
    .select("id, title, summary, raw_text, parliament_id")
    .eq("id", billId)
    .single();

  if (billError || !bill) {
    return { success: false, error: "Lakiesitystä ei löydy." };
  }

  let base =
    bill.summary && bill.summary.length > 600
      ? bill.summary
      : prepareBillTextForAI(bill.raw_text || "") || bill.title || "";

  if (base.length < 200) {
    return {
      success: false,
      error:
        "Liian vähän lähdetekstiä. Päivitä ensin asiantuntija-analyysi (Päivitä analyysi).",
    };
  }

  base = base.slice(0, 38_000);

  try {
    const { generateText } = await import("ai");
    const { openai } = await import("@ai-sdk/openai");

    const { text, usage } = await generateText({
      model: openai("gpt-4o") as any,
      system: `Olet valtiontalouden, oikeuden ja yhteiskuntapolitiikan riippumaton asiantuntija.
Kirjoitat syvällisen analyysin **suomeksi**. Puolueettomuus ja lähteiden erottelu ovat tärkeitä.
Rakenna teksti väliotsikoilla (###). Älä toista vain esityksen otsikkoa; pureudu sisältöön.
Jos lähdetekstissä ei ole nimettyjä kannanottoja, älä keksi lainauksia: ilmoita että kannat ovat **arvio** aihepiirin ja tyypillisen intressikentän perusteella.`,
      prompt: `Lakiesitys: ${bill.title} (${bill.parliament_id || ""})

Alla lähdemateriaali (tiivistelmä ja/tai raakateksti):

${base}

---
Tuota **yksi yhtenäinen syväanalyysi** pitkänä markdown-tekstinä.

**Pituus:** pyri **noin 22 000–25 000 merkkiin** (tilaa riittää; käytä sitä syventäviin kappaleisiin ja perusteluihin). Jos jokin osa jää ohueksi, laajenna talousvaikutus- ja sidosryhmäosioita.

**Pakollinen rakenne** (käytä täsmälleen näitä pääotsikkoja, järjestys alla):

### Keskeinen sisältö ja tavoite

### Asiantuntijan näkemys: miksi laki on tarpeen
- Selosta asiantuntijatason perusteella: mikä ongelma tai aukko nykyisessä järjestelmässä korjautuu, mitkä lainsäädäntötavoitteet ja yhteiskunnalliset tehtävät tukevat uudistusta, ja mitä voisi tapahtua ilman lakia (neutraalisti, ilman sensationalismia). Erotta selvästi faktuaalinen esityksen sisältö omasta synteesistäsi.

### Talous- ja julkisen talouden vaikutukset
- Arviot, jos tekstissä lukuja; muuten kvalitatiivinen ja järjestelmätason analyysi.

### Vaikutus eri ryhmiin
- Tuloluokat, alueet, palveluntuottajat, viranomaiset, kotitaloudet, työnantajat/työntekijät jne. soveltuvin osin.

### Etujärjestöt ja intressit: puolesta ja vastaan
Tämä osio on **keskeinen**. Käytä alaotsikkoja:

#### Tukevat tai todennäköisesti myötäiset intressit
- Luettele **konkreettisia** tyyppejä: esim. työmarkkina- ja elinkeinoelämän järjestöt, alakohtaiset etujärjestöt, kuluttaja- tai ammattijärjestöt, kuntasektori, järjestökenttä, tutkimuslaitokset — vain jos ne liittyvät esityksen aiheeseen.
- Jokaiselle 1–2 lausetta: *miksi* intressi linjautuu esityksen kanssa.
- Jos et näe lähteessä virallisia lausuntoja, merkitse selvästi: "**Arvio** (ei viitettä annettuun lausuntoon tässä aineistossa)."

#### Vastustavat tai kriittiset intressit
- Sama rakenne: ketkä todennäköisesti vastustavat tai vaativat muutoksia ja miksi.

#### Yhteenveto intressitörmäyksestä
- Tiivis synteesi ristiriidoista ja neuvottelupainopisteistä.

### Oikeudelliset ja hallinnolliset riskit sekä toteutus

### Poliittinen ja lobbausympäristö
- Neutraalisti; vältä huhupuhetta. Viittaa vain aineistoon tai yleiseen prosessitietoon.

### Yhteenveto ja tuleva näkymä

Älä käytä JSONia; pelkkä markdown.`,
      maxTokens: 16_000,
      temperature: 0.35,
    } as any);

    await logAiCost(
      "Bill deep analysis",
      "gpt-4o",
      usage.promptTokens,
      usage.completionTokens,
    );

    const deep = (text ?? "").trim();
    if (deep.length < 5_000) {
      return {
        success: false,
        error: "Malli palautti liian lyhyen analyysin. Yritä uudelleen.",
      };
    }

    const { error: upErr } = await admin.from("bill_ai_profiles").upsert(
      {
        bill_id: billId,
        deep_analysis: deep.slice(0, 260_000),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "bill_id" },
    );

    if (upErr) {
      return { success: false, error: upErr.message };
    }

    return { success: true, chars: deep.length };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: msg };
  }
}

/**
 * Public server action: Process bill (uses cache if available)
 */
export async function processBillToSelkokieli(
  billId: string,
  providedSupabase?: any,
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
  return processBillToSelkokieliInternal(billId, false, providedSupabase);
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
