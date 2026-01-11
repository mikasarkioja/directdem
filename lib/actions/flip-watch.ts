// lib/actions/flip-watch.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { revalidatePath } from "next/cache";

/**
 * AI-powered Flip-Flop Detection Engine
 * Compares deep analysis results against representative's promises.
 */
export async function detectFlipsWithAI(params: {
  billId: string;
  billTitle: string;
  deepAnalysis: any;
  context: "parliament" | "municipal";
  municipality?: string;
}) {
  const { billId, billTitle, deepAnalysis, context, municipality } = params;
  const supabase = await createClient();

  console.log(`🚨 Käynnistetään Takinkääntö-vahti: ${billTitle} (${context})`);

  try {
    // 1. Get representatives
    let representatives: any[] = [];
    if (context === "parliament") {
      const { data: mps } = await supabase
        .from("mps")
        .select(`
          id, 
          first_name, 
          last_name, 
          party,
          mp_ai_profiles ( conflicts, promise_data ),
          mp_profiles ( economic_score, liberal_conservative_score, environmental_score )
        `)
        .limit(200); // Process all MPs
      representatives = mps || [];
    } else {
      const { data: councilors } = await supabase
        .from("councilors")
        .select("*")
        .eq("municipality", municipality);
      representatives = councilors || [];
    }

    if (representatives.length === 0) return { success: true, count: 0 };

    // 2. Identify Hotspots & Impact Summary for AI
    const analysisSummary = `
      Otsikko: ${billTitle}
      Kustannusarvio: ${deepAnalysis.economic_impact?.total_cost_estimate} €
      Pääasiallinen ajuri: ${deepAnalysis.strategic_analysis?.primary_driver}
      Hotspotit: ${JSON.stringify(deepAnalysis.controversy_hotspots)}
      Voittajat: ${deepAnalysis.social_equity?.winners?.join(", ")}
      Häviäjät: ${deepAnalysis.social_equity?.losers?.join(", ")}
    `;

    // 3. Batch process representatives with AI to find contradictions
    // Note: In a real production app, we might do this in chunks or for selected MPs to save costs.
    // For now, let's pick top 10 most relevant MPs (e.g. those in relevant committees or with high conflict potential)
    const selectedReps = representatives.slice(0, 50); // Limit for safety in this demo

    const { text: alertsJson } = await generateText({
      model: openai("gpt-4o-mini") as any,
      system: `Olet Takinkääntö-vahti, poliittisen rehellisyyden vartija. 
      Tehtäväsi on verrata lakiesityksen vaikutuksia kansanedustajien/valtuutettujen antamiin vaalilupauksiin ja heidän poliittiseen profiiliinsa.
      
      Etsi RISTIRIITOJA (Takinkääntöjä). Esimerkiksi:
      - Edustaja lupasi säästöjä, mutta äänestää kalliin investoinnin puolesta.
      - Edustaja lupasi suojella luontoa, mutta esitys heikentää ympäristön tilaa.
      - Edustaja lupasi puolustaa pienituloisia, mutta esitys leikkaa heidän etuuksiaan.
      
      Palauta VAIN JSON-muotoinen lista löydetyistä hälytyksistä:
      [
        {
          "mp_id": number,
          "category": "Talous/Ympäristö/Arvot/jne",
          "severity": "low/medium/high",
          "reasoning": "Lyhyt selitys miksi tämä on ristiriidassa lupauksen kanssa.",
          "promise_value": 1-5,
          "deviation_score": 0.0-1.0
        }
      ]`,
      prompt: `
        LAKIESITYS:
        ${analysisSummary}
        
        EDUSTAJAT JA HEIDÄN PROFIILINSA:
        ${JSON.stringify(selectedReps.map(r => ({
          id: r.id,
          name: `${r.first_name || r.full_name} (${r.party})`,
          promises: r.mp_ai_profiles?.promise_data || r.election_promises,
          dna: r.mp_profiles || r.dna_fingerprint
        })))}
      `,
    });

    const alerts = JSON.parse(alertsJson.replace(/```json\n?/, "").replace(/\n?```/, "").trim());

    // 4. Store alerts in DB
    if (alerts && alerts.length > 0) {
      console.log(`📢 Löydettiin ${alerts.length} mahdollista takinkääntöä!`);
      
      for (const alert of alerts) {
        await supabase.from("integrity_alerts").upsert({
          mp_id: alert.mp_id,
          event_id: billId,
          category: alert.category,
          promise_value: alert.promise_value,
          vote_type: "jaa", // Oletetaan 'jaa' tässä vaiheessa tai hae MP:n oikea ääni jos se on jo tiedossa
          deviation_score: alert.deviation_score,
          severity: alert.severity,
          reasoning: alert.reasoning // We might need to add this column to the schema
        }, { onConflict: "mp_id,event_id" });

        // 5. Send notifications to followers
        const { data: followers } = await supabase
          .from("user_follows")
          .select("user_id")
          .eq("mp_id", alert.mp_id);

        if (followers && followers.length > 0) {
          const mp = representatives.find(r => r.id === alert.mp_id);
          const mpName = mp ? `${mp.first_name || mp.full_name} (${mp.party})` : "Edustaja";
          
          const notifications = followers.map(f => ({
            user_id: f.user_id,
            title: `Takinkääntö-hälytys: ${mpName}`,
            message: `Havaittu ristiriita esityksessä "${billTitle}": ${alert.reasoning}`,
            type: "alert",
            link: `/dashboard?bill=${billId}`
          }));

          await supabase.from("user_notifications").insert(notifications);
        }
      }
    }

    revalidatePath("/dashboard");
    return { success: true, count: alerts.length };

  } catch (error: any) {
    console.error("❌ Takinkääntö-vahdin virhe:", error);
    return { success: false, error: error.message };
  }
}

