import { getLatestNews } from "@/lib/news/news-service";
import { createClient } from "@/lib/supabase/server";
import { PoliticalVector, tagPoliticalAlignment } from "../ai/tagger";
import { fetchBillsFromSupabase } from "@/app/actions/bills-supabase";

export interface FeedItem {
  id: string;
  title: string;
  description: string;
  date: string;
  source: string;
  type: "news" | "local" | "bill";
  link: string;
  tags: string[];
  category?: string; // e.g., 'INVESTOINTI', 'SÄÄSTÖ'
  political_vector?: PoliticalVector;
  relevanceScore?: number;
}

export async function getIntelligenceFeed(userDna?: any): Promise<FeedItem[]> {
  try {
    const supabase = await createClient();

    // 1. Fetch News
    const newsItems = await getLatestNews();
    const formattedNews: FeedItem[] = await Promise.all(
      newsItems.map(async (item, idx) => {
        // For demo purposes, we tag them on the fly if they don't have vectors
        // In production, this would be a background job.
        return {
          id: `news-${idx}`,
          title: item.title,
          description: item.contentSnippet,
          date: item.pubDate,
          source: item.source,
          type: "news",
          link: item.link,
          tags: ["Politiikka"],
          // Simple heuristic for demo: tag the first few news items
          political_vector:
            idx < 3
              ? await tagPoliticalAlignment(item.title, item.contentSnippet)
              : undefined,
        };
      }),
    );

    // 2. Fetch Local Decisions (Espoo)
    const { getEspooDecisions } = await import("@/app/actions/espoo-actions");
    const decisions = await getEspooDecisions();

    const formattedLocal: FeedItem[] = (decisions || []).map((item: any) => ({
      id: `local-${item.id || item.external_id}`,
      title: item.title,
      description: item.summary || item.description || "",
      date: item.decision_date,
      source: "Espoon kaupunki",
      type: "local",
      link: item.url || `/dashboard/espoo?id=${item.id}`,
      tags: item.neighborhoods || [],
      category: item.category,
      political_vector: item.political_vector,
    }));

    // 3. Fetch National Bills
    const bills = await fetchBillsFromSupabase();
    const formattedBills: FeedItem[] = bills.slice(0, 30).map((item: any) => ({
      id: `bill-${item.id}`,
      title: item.title,
      description: item.summary || "",
      date: item.publishedDate || new Date().toISOString(),
      source: "Eduskunta",
      type: "bill",
      link: `/dashboard?view=committee&billId=${item.id}`,
      tags: [item.category || "Lainsäädäntö"],
      category: item.category,
      political_vector: undefined, // Bills might not have vectors yet in this table
    }));

    // 4. Combine and Sort
    let combined = [...formattedNews, ...formattedLocal, ...formattedBills];

    if (userDna) {
      const { calculateFeedRelevance } = await import("./relevance");
      combined = combined.map((item) => {
        if (item.political_vector) {
          const rel = calculateFeedRelevance(userDna, item.political_vector);
          return { ...item, relevanceScore: rel.score };
        }
        return item;
      });
    }

    combined.sort((a, b) => {
      // If userDna and relevanceScore exist, we can influence sorting
      // but usually we want to keep it chronological or high relevance
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return combined;
  } catch (error) {
    console.error("Failed to fetch intelligence feed:", error);
    return [];
  }
}
