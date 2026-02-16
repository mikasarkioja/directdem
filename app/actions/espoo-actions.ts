"use server";

import { createClient } from "@/lib/supabase/server";
import {
  fetchEspooDynastyLinks,
  fetchMeetingItems,
  fetchDynastyContent,
} from "@/lib/scrapers/espoo-dynasty";
import { analyzeCityDecision } from "@/lib/ai/city-summarizer";

/**
 * Fetches and analyzes latest Espoo decisions.
 * In a real app, this would be a background job.
 */
export async function getEspooDecisions() {
  const supabase = await createClient();

  // 1. Haetaan olemassa olevat päätökset tietokannasta
  const { data: existingDecisions } = await supabase
    .from("municipal_decisions")
    .select("*")
    .eq("municipality", "Espoo")
    .order("decision_date", { ascending: false })
    .limit(30);

  // 2. Kokeillaan hakea livenä (tämä on hidas, mutta demossa ok)
  // Tehdään haku vain jos dataa on vähän tai jos halutaan varmistaa tuoreus
  try {
    console.log("🔗 Käynnistetään Espoo-skanneri...");
    const links = await fetchEspooDynastyLinks();

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
        console.log("✅ Ei uusia asioita tässä kokouksessa.");
        return existingDecisions || [];
      }

      console.log(`🆕 Löytyi ${newItems.length} uutta asiaa. Analysoidaan...`);

      const analyzedDecisions = [...(existingDecisions || [])];
      for (const item of newItems) {
        const content = await fetchDynastyContent(item);
        if (content) {
          const analysis = await analyzeCityDecision(
            content.title,
            content.description,
          );

          const decision = {
            municipality: "Espoo",
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

          // Tallennetaan kantaan tulevaa käyttöä varten
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
  } catch (err) {
    console.error("Error in getEspooDecisions:", err);
  }

  return existingDecisions || [];
}
