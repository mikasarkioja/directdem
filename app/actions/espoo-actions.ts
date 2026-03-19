"use server";

import { createClient } from "@/lib/supabase/server";
import {
  fetchDynastyLinks,
  fetchMeetingItems,
  fetchDynastyContent,
} from "@/lib/scrapers/espoo-dynasty";
import { analyzeCityDecision } from "@/lib/ai/city-summarizer";
import { getMunicipalAPI } from "@/lib/municipal-api";

/**
 * Fetches and analyzes latest municipal decisions for a specific city.
 * Supports Dynasty (Espoo, Vantaa) and custom APIs (Helsinki).
 */
export async function getMunicipalDecisions(
  municipality: string = "Espoo",
  providedSupabase?: any,
) {
  const supabase = providedSupabase || (await createClient());

  // 1. Haetaan olemassa olevat päätökset tietokannasta
  const { data: existingDecisions } = await supabase
    .from("municipal_decisions")
    .select("*")
    .eq("municipality", municipality)
    .order("decision_date", { ascending: false })
    .limit(30);

  try {
    console.log(`🔗 Käynnistetään ${municipality}-skanneri...`);

    // Dynasty-pohjaiset kaupungit (Espoo, Vantaa)
    if (municipality === "Espoo" || municipality === "Vantaa") {
      const links = await fetchDynastyLinks(municipality as any);

      if (links.length > 0) {
        // Haetaan asiat uusimmasta kokouksesta
        const meetingUrl = links[0].url;
        console.log(`📂 Haetaan asiat kokouksesta: ${meetingUrl}`);

        const items = await fetchMeetingItems(meetingUrl);

        // Etsitään vain sellaisia asioita joita meillä ei vielä ole
        const existingUrls = new Set(
          existingDecisions?.map((d) => d.external_id) || [],
        );
        const newItems = items
          .filter((l) => !existingUrls.has(l.url))
          .slice(0, 3);

        if (newItems.length === 0) {
          console.log(`✅ Ei uusia asioita kaupungille ${municipality}.`);
          return existingDecisions || [];
        }

        console.log(
          `🆕 Löytyi ${newItems.length} uutta asiaa kaupungille ${municipality}. Analysoidaan...`,
        );

        const analyzedDecisions = [...(existingDecisions || [])];
        for (const item of newItems) {
          const content = await fetchDynastyContent(item, municipality);
          if (content) {
            // Säästetään tokeneita kehitysympäristössä: Älä analysoi kaikkia heti livenä
            const isDev = process.env.NODE_ENV === "development";
            const autoAI = process.env.ENABLE_AUTO_AI === "true";

            let analysis;
            if (isDev && !autoAI) {
              console.log(
                `🛠 [Dev Mode] Luodaan mock-analyysi asialle: ${item.title}`,
              );
              analysis = {
                summary: `[MOCK-ANALYYSI] Tämä on kehitysympäristön automaattinen tiivistelmä asialle "${item.title}". Oikea AI-analyysi on pois päältä token-kulujen säästämiseksi.`,
                category: "MUU" as const,
                whoDecided: `${municipality}n kaupunki`,
                whatDecided: item.title,
                impactOnResident: "Kehitysympäristö: ei vaikutusta.",
                neighborhoods: [],
                political_vector: {
                  economic: 0,
                  values: 0,
                  environment: 0,
                  regions: 0,
                  globalism: 0,
                  security: 0,
                },
              };
            } else {
              analysis = await analyzeCityDecision(
                content.title,
                content.description,
                `${municipality}n kaupunki`,
              );
            }

            const decision = {
              municipality: municipality,
              external_id: item.url,
              title: item.title,
              summary: analysis.summary,
              decision_date: links[0].dateHint
                ? new Date(
                    links[0].dateHint.split(".").reverse().join("-"),
                  ).toISOString()
                : new Date().toISOString(),
              category: analysis.category,
              neighborhoods: analysis.neighborhoods,
              political_vector: analysis.political_vector,
              analysis_data: analysis,
              url: item.url,
              pdf_url: item.pdfUrl,
            };

            // Tallennetaan kantaan
            await supabase
              .from("municipal_decisions")
              .upsert(decision, { onConflict: "municipality,external_id" });
            analyzedDecisions.unshift(decision);
          }
        }
        return analyzedDecisions.sort(
          (a, b) =>
            new Date(b.decision_date).getTime() -
            new Date(a.decision_date).getTime(),
        );
      }
    } else {
      // Muut kaupungit (esim. Helsinki) käyttävät omia API-toteutuksiaan
      const api = getMunicipalAPI(municipality);
      const items = await api.fetchLatestItems(5);

      const existingIds = new Set(
        existingDecisions?.map((d) => d.external_id) || [],
      );
      const newItems = items.filter((item) => !existingIds.has(item.id));

      if (newItems.length === 0) return existingDecisions || [];

      console.log(
        `🆕 Löytyi ${newItems.length} uutta asiaa kaupungille ${municipality} (API).`,
      );

      const analyzedDecisions = [...(existingDecisions || [])];
      for (const item of newItems) {
        // Säästetään tokeneita kehitysympäristössä
        const isDev = process.env.NODE_ENV === "development";
        const autoAI = process.env.ENABLE_AUTO_AI === "true";

        let analysis;
        if (isDev && !autoAI) {
          console.log(
            `🛠 [Dev Mode API] Luodaan mock-analyysi asialle: ${item.title}`,
          );
          analysis = {
            summary: `[MOCK-ANALYYSI] Tämä on kehitysympäristön automaattinen tiivistelmä asialle "${item.title}". Oikea AI-analyysi on pois päältä.`,
            category: "MUU" as const,
            whoDecided: `${municipality}n kaupunki`,
            whatDecided: item.title,
            impactOnResident: "Tietoa ei saatavilla kehitysympäristössä.",
            neighborhoods: [],
            political_vector: {
              economic: 0,
              values: 0,
              environment: 0,
              regions: 0,
              globalism: 0,
              security: 0,
            },
          };
        } else {
          analysis = await analyzeCityDecision(
            item.title,
            item.content || item.summary || "",
            `${municipality}n kaupunki`,
          );
        }

        const decision = {
          municipality: municipality,
          external_id: item.id,
          title: item.title,
          summary: analysis.summary,
          decision_date: item.meetingDate || new Date().toISOString(),
          category: analysis.category,
          neighborhoods: analysis.neighborhoods,
          political_vector: analysis.political_vector,
          analysis_data: analysis,
          url: item.url,
        };

        await supabase
          .from("municipal_decisions")
          .upsert(decision, { onConflict: "municipality,external_id" });
        analyzedDecisions.unshift(decision);
      }
      return analyzedDecisions;
    }
  } catch (err) {
    console.error(`Error in getMunicipalDecisions for ${municipality}:`, err);
  }

  return existingDecisions || [];
}

/**
 * Legacy support for Espoo only
 */
export async function getEspooDecisions() {
  return getMunicipalDecisions("Espoo");
}
