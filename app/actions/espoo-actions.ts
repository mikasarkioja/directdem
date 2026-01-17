"use server";

import { createClient } from "@/lib/supabase/server";
import { fetchEspooDynastyLinks, fetchMeetingItems, fetchDynastyContent } from "@/lib/scrapers/espoo-dynasty";
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
    .limit(20);

  // Jos meillä on jo dataa, palautetaan se (nopea kokemus)
  if (existingDecisions && existingDecisions.length > 5) {
    return existingDecisions;
  }

  // 2. Jos dataa puuttuu, kokeillaan hakea livenä (tämä on hidas, mutta demossa ok)
  try {
    const links = await fetchEspooDynastyLinks();
    if (links.length > 0) {
      const items = await fetchMeetingItems(links[0].url);
      const latestItems = items.slice(0, 3); // Otetaan vain muutama testiksi

      const analyzedDecisions = [];
      for (const item of latestItems) {
        const content = await fetchDynastyContent(item);
        if (content) {
          const analysis = await analyzeCityDecision(content.title, content.description);
          
          const decision = {
            municipality: "Espoo",
            external_id: item.url,
            title: item.title,
            summary: analysis.summary,
            decision_date: new Date().toISOString(), // Dynasty-sivulta pitäisi kaivaa tarkka pvm
            category: analysis.category,
            neighborhoods: analysis.neighborhoods,
            political_vector: analysis.political_vector,
            analysis_data: analysis,
            url: item.url,
            pdf_url: item.pdfUrl
          };

          analyzedDecisions.push(decision);
          
          // Tallennetaan kantaan tulevaa käyttöä varten
          await supabase.from("municipal_decisions").upsert(decision, { onConflict: "municipality,external_id" });
        }
      }
      return analyzedDecisions;
    }
  } catch (err) {
    console.error("Error in getEspooDecisions:", err);
  }

  return existingDecisions || [];
}

