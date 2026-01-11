import axios from "axios";
import pdf from "pdf-parse";
import { createClient } from "@supabase/supabase-js";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { revalidatePath } from "next/cache";

/**
 * lib/municipal/deep-analyzer.ts
 * Louhii syväanalyysin kuntien päätöksistä liitteineen.
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * 1. Liitteiden lukija (PDF/HTML Scraper)
 */
export async function extractTextFromAttachment(url: string): Promise<string> {
  try {
    console.log(`📥 Noudetaan liite: ${url}`);
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data);

    // Tarkistetaan onko PDF vai jotain muuta
    if (url.toLowerCase().endsWith(".pdf")) {
      const data = await pdf(buffer);
      return data.text;
    } else {
      // Oletetaan HTML tai teksti
      return buffer.toString("utf-8");
    }
  } catch (error: any) {
    console.error(`❌ Virhe liitteen lukemisessa (${url}):`, error.message);
    return "";
  }
}

/**
 * 2. Syväanalyysi (GPT-4o)
 */
export async function performDeepAnalysis(item: { 
  id: string; 
  title: string; 
  municipality: string; 
  raw_content?: string; 
  external_url?: string;
  attachment_urls?: string[];
}) {
  console.log(`🧠 Käynnistetään syväanalyysi: ${item.title}`);

  try {
    // Luetaan liitteet jos niitä on
    let additionalContext = "";
    if (item.attachment_urls && item.attachment_urls.length > 0) {
      for (const url of item.attachment_urls) {
        const text = await extractTextFromAttachment(url);
        additionalContext += `\n\n--- LIITE (${url}) ---\n${text.substring(0, 10000)}`;
      }
    }

    const { text: analysisJson } = await generateText({
      model: openai("gpt-4o") as any,
      system: `Olet kuntatalouden, hallinnon ja poliittisen analyysin huippuasiantuntija. 
      Tehtäväsi on luoda äärimmäisen syvällinen, laaja ja rakenteellinen analyysi päätösesityksestä ja sen kaikista liitteistä.
      
      OHJEET ANALYYSIIN:
      - Tee 'summary' -osasta valtavan laaja (tavoite vähintään 15 000 merkkiä). 
      - Jaa teksti selkeisiin kappaleisiin ja käytä kuvaavia väliotsikoita (Markdown ### Otsikko).
      - Älä tiivistä, vaan pura auki päätöksen pienimmätkin yksityiskohdat, taustat ja vaikutukset.
      - Analysoi kustannusrakenteet, vaihtoehtoiskustannukset ja mahdolliset poliittiset jännitteet.
      
      Etsi erityisesti:
      - Taloudelliset vaikutukset (eurosummat, säästöt, investoinnit).
      - Strategiset ajurit (miksi tämä tehdään?).
      - Voittajat ja häviäjät.
      - Mahdolliset poliittiset kiistat (Hotspots).
      
      Palauta tiedot VAIN tässä JSON-muodossa:
      {
        "economic_impact": {
          "total_cost_estimate": number,
          "budget_alignment": "string",
          "funding_source": "string",
          "operational_cost_increase_yearly": number
        },
        "strategic_analysis": {
          "primary_driver": "string",
          "strategy_match_score": number,
          "legal_obligation": boolean
        },
        "social_equity": {
          "winners": ["string"],
          "losers": ["string"],
          "accessibility_impact": "string"
        },
        "controversy_hotspots": [
          {
            "issue": "string",
            "tension_level": number,
            "reasoning": "string"
          }
        ],
        "summary": "TÄHÄN ÄÄRIMMÄISEN LAAJA JA RAKENTEELLINEN ANALYYSI (15 000 MERKKIÄ). Käytä väliotsikoita ja selkeitä kappaleita.",
        "attachment_notes": "Yksityiskohtaiset huomiot liitteistä ja niiden datasta."
      }`,
      prompt: `
        Otsikko: ${item.title}
        Kaupunki: ${item.municipality}
        Pääsisältö: ${item.raw_content?.substring(0, 10000)}
        Liitteiden sisältö: ${additionalContext.substring(0, 20000)}
      `,
      maxTokens: 6000,
      temperature: 0.7
    });

    const analysis = JSON.parse(analysisJson.replace(/```json\n?/, "").replace(/\n?```/, "").trim());

    // 3. Kuntavaali-linkitys (Takinkääntö-vahti)
    const { detectFlipsWithAI } = await import("@/lib/actions/flip-watch");
    await detectFlipsWithAI({
      billId: item.id,
      billTitle: item.title,
      deepAnalysis: analysis,
      context: "municipal",
      municipality: item.municipality
    });

    // 4. Tallennus bill_enhanced_profiles -tauluun
    const enhancedId = `MUNI-${item.municipality.toUpperCase()}-${item.id}`;
    const { error: upsertError } = await supabase
      .from("bill_enhanced_profiles")
      .upsert({
        bill_id: enhancedId,
        title: item.title,
        category: "Municipal",
        dna_impact_vector: analysis.dna_impact || {}, 
        analysis_data: {
          bill_id: enhancedId,
          title: item.title,
          analysis_depth: analysis // Tässä on se pyydetty syvärakenteinen JSON
        },
        forecast_metrics: {
          friction_index: analysis.controversy_hotspots?.[0]?.tension_level * 10 || 0,
          economic_impact: analysis.economic_impact,
          social_equity: analysis.social_equity
        }
      }, { onConflict: "bill_id" });

    if (upsertError) throw upsertError;

    return { success: true, analysis };

  } catch (error: any) {
    console.error("❌ Syväanalyysi epäonnistui:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Takinkääntö-vahti syväanalyysille
 */
async function detectDeepFlips(itemId: string, municipality: string, analysis: any) {
  // Haetaan valtuutetut
  const { data: councilors } = await supabase
    .from("councilors")
    .select("*")
    .eq("municipality", municipality);

  if (!councilors) return;

  // Esimerkkilogiikka: Jos taloudellinen vaikutus on suuri kulu ja valtuutettu lupasi säästöjä tietyllä alueella
  const cost = analysis.economic_impact?.total_cost_estimate || 0;
  
  if (cost > 1000000) { // Yli miljoonan investointi
    for (const councilor of councilors) {
      // Tarkistetaan vaalilupaukset avainsanoilla (yksinkertaistettu esimerkki)
      const promises = JSON.stringify(councilor.election_promises).toLowerCase();
      if (promises.includes("säästö") || promises.includes("leikkaus")) {
        // Luodaan automaattinen hälytys jos valtuutettu on kytketty tähän asiaan
        // Tässä kohtaa tarvittaisiin tarkempi kytkentä kuka on tehnyt esityksen
      }
    }
  }
}

