"use server";

import { createClient } from "@/lib/supabase/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { revalidatePath } from "next/cache";
import { performDeepAnalysis } from "@/lib/municipal/deep-analyzer";

export async function startDeepAnalysis(itemId: string) {
  const supabase = await createClient();

  // 1. Get the item from either table
  let item: any = null;
  
  const { data: analysisItem } = await supabase
    .from("meeting_analysis")
    .select("*")
    .eq("id", itemId)
    .maybeSingle();

  if (analysisItem) {
    item = analysisItem;
  } else {
    const { data: decisionItem } = await supabase
      .from("municipal_decisions")
      .select("*")
      .eq("id", itemId)
      .maybeSingle();
    
    if (decisionItem) {
      item = {
        id: decisionItem.id,
        meeting_title: decisionItem.title,
        municipality: decisionItem.municipality,
        raw_content: decisionItem.content_summary,
        ai_summary: decisionItem.ai_summary || {}
      };
    }
  }

  if (!item) return { success: false, error: "Kohdetta ei löytynyt." };

  // 2. Perform deep analysis
  const result = await performDeepAnalysis({
    id: item.id,
    title: item.meeting_title || item.title,
    municipality: item.municipality,
    raw_content: item.raw_content,
    attachment_urls: item.ai_summary?.attachment_urls || [] 
  });

  if (result.success) {
    revalidatePath("/dashboard");
  }

  return result;
}

export async function fetchEnhancedMunicipalProfile(itemId: string, municipality: string) {
  const supabase = await createClient();
  const enhancedId = municipality === "parliament" 
    ? itemId 
    : `MUNI-${municipality.toUpperCase()}-${itemId}`;

  const { data, error } = await supabase
    .from("bill_enhanced_profiles")
    .select("*")
    .eq("bill_id", enhancedId)
    .maybeSingle();

  if (error) return null;
  return data;
}

export async function generateMunicipalAiSummary(itemId: string) {
  const supabase = await createClient();

  // 1. Get the item from either meeting_analysis or municipal_decisions
  let item: any = null;
  let sourceTable = "meeting_analysis";

  const { data: analysisItem } = await supabase
    .from("meeting_analysis")
    .select("*")
    .eq("id", itemId)
    .maybeSingle();

  if (analysisItem) {
    item = analysisItem;
    sourceTable = "meeting_analysis";
  } else {
    const { data: decisionItem } = await supabase
      .from("municipal_decisions")
      .select("*")
      .eq("id", itemId)
      .maybeSingle();
    
    if (decisionItem) {
      item = decisionItem;
      sourceTable = "municipal_decisions";
    }
  }

  if (!item) {
    return { success: false, error: "Kohdetta ei löytynyt kummastakaan taulusta." };
  }

  try {
    // 2. Get councilors for context
    const { data: councilors } = await supabase
      .from("councilors")
      .select("full_name, party")
      .eq("municipality", item.municipality);

    const councilorList = councilors?.map(c => `${c.full_name} (${c.party})`).join(", ") || "";

    // 3. AI Analysis & Deep Analysis Combined
    const { text: analysisJson } = await generateText({
      model: openai("gpt-4o") as any,
      system: `Olet kunnallispolitiikan, hallinnon ja talouden huippuanalyytikko. Tehtäväsi on luoda äärimmäisen syvällinen, laaja ja rakenteellinen analyysi päätösesityksestä.
      
      ESITYSTAPA:
      - Kirjoita teksti kuin se olisi virallinen KONSULTIN SELONTEKO.
      - Käytä asiallista, vakuuttavaa ja analyyttistä kieltä.
      - JAA TEKSTI SELKEISIIN KAPPALEISIIN (vähintään 3-5 virkettä per kappale).
      - Käytä Markdown-otsikoita (### Otsikko) erottamaan eri osa-alueet.
      
      OHJEET ANALYYSIIN:
      - Tee 'summary' -osasta valtavan laaja (tavoite vähintään 15 000 merkkiä). 
      - Pura auki jokainen pykälä, taloudelliset vaikutukset, strategiset ajurit ja poliittiset jännitteet.
      - Analysoi päätöksen taustat (historia), nykytila ja tulevaisuuden skenaariot.
      - Tunnista voittajat, häviäjät ja mahdolliset sidonnaisuudet.
      
      Palauta VAIN JSON tässä muodossa:
      {
        "mentioned_councilors": ["Nimi 1", "Nimi 2"],
        "dna_impact": { "economy": 0.0, "values": 0.0, "environment": 0.0, "regional": 0.0, "international": 0.0, "security": 0.0 },
        "summary": "### 1. JOHDANTO JA PÄÄTÖKSEN TAUSTA\n\n[Tekstiä...]\n\n### 2. TALOUDELLINEN ANALYYSI JA KUSTANNUSRAKENNE\n\n[Tekstiä...]\n\n### 3. STRATEGINEN YHTEENSOPIVUUS\n\n[Tekstiä...]\n\n### 4. SOSIAALISET JA ALUEELLISET VAIKUTUKSET\n\n[Tekstiä...]\n\n### 5. POLIITTINEN RISKI JA JÄNNITTEET\n\n[Tekstiä...]",
        "attachment_notes": "Huomioita liitteistä ja talousluvuista.",
        "pro_arguments": ["Argumentti 1", "Argumentti 2"],
        "con_arguments": ["Kriittinen huomio 1", "Kriittinen huomio 2"],
        "friction_index": 45,
        "deep_analysis": {
          "economic_impact": {
            "total_cost_estimate": 0,
            "budget_alignment": "string",
            "funding_source": "string"
          },
          "strategic_analysis": {
            "primary_driver": "string",
            "strategy_match_score": 85
          },
          "social_equity": {
            "winners": ["string"],
            "losers": ["string"]
          }
        }
      }`,
      prompt: `
        Kaupunki: ${item.municipality}
        Otsikko: ${item.meeting_title || item.title}
        Sisältö: ${(item.raw_content || item.content_summary || "").substring(0, 20000) || "Ei sisältöä."}
        
        Mahdolliset valtuutetut: ${councilorList}
      `,
      maxTokens: 8000,
      temperature: 0.7
    });

    const cleanedJson = analysisJson.replace(/```json\n?/, "").replace(/\n?```/, "").trim();
    const analysis = JSON.parse(cleanedJson);

    // 4. Update the DB (Both tables and enhanced profile)
    const enhancedId = `MUNI-${item.municipality.toUpperCase()}-${item.id}`;
    
    // Update meeting_analysis
    if (sourceTable === "meeting_analysis") {
      await supabase.from("meeting_analysis").update({ ai_summary: analysis }).eq("id", itemId);
    } else {
      await supabase.from("municipal_decisions").update({ ai_summary: analysis }).eq("id", itemId);
    }

    // Update bill_enhanced_profiles for deep data persistent storage
    await supabase.from("bill_enhanced_profiles").upsert({
      bill_id: enhancedId,
      title: item.meeting_title || item.title,
      category: "Municipal",
      dna_impact_vector: analysis.dna_impact,
      analysis_data: { 
        simple_summary: item.meeting_title || item.title,
        analysis_depth: analysis.deep_analysis 
      },
      forecast_metrics: { friction_index: analysis.friction_index }
    }, { onConflict: "bill_id" });

    revalidatePath("/dashboard");
    return { success: true, analysis };

  } catch (err: any) {
    console.error("AI Generation Error:", err);
    return { success: false, error: err.message };
  }
}

