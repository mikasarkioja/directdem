"use server";

import { createClient } from "@/lib/supabase/server";
import { getLatestNews } from "@/lib/news/news-service";

export interface NewsItem {
  id: string | number;
  title: string;
  time: string;
  type: "news" | "radar" | "alert";
  severity?: "low" | "medium" | "high";
  meta?: any;
  link?: string;
  description?: string;
}

/**
 * Fetches combined newsfeed: real news from Yle RSS and transparency alerts from Supabase.
 */
export async function getCombinedNews(lens: string = "national"): Promise<NewsItem[]> {
  const supabase = await createClient();

  // 1. Fetch real news from Yle RSS
  const yleNews = await getLatestNews();
  const news: NewsItem[] = yleNews.map((item, index) => ({
    id: `yle-${index}`,
    title: item.title,
    time: new Date(item.pubDate).toLocaleString("fi-FI", { 
      day: "numeric", 
      month: "numeric", 
      hour: "2-digit", 
      minute: "2-digit" 
    }),
    type: "news",
    link: item.link,
    description: item.contentSnippet
  }));

  // 2. Fetch Transparency Alerts (Sidonnaisuus-tutka)
  // We look into mp_ai_profiles where last_conflict_analysis has a high score
  // or integrity_alerts with category 'Sidonnaisuus'
  const { data: alerts } = await supabase
    .from("mp_ai_profiles")
    .select(`
      mp_id,
      last_conflict_analysis,
      mps (first_name, last_name)
    `)
    .not("last_conflict_analysis", "is", null)
    .limit(5);

  if (alerts) {
    alerts.forEach((p: any) => {
      // last_conflict_analysis is an object mapping billId -> analysis
      const analysisMap = p.last_conflict_analysis;
      Object.entries(analysisMap).forEach(([billId, analysis]: [string, any]) => {
        if (analysis && analysis.score >= 50 && billId !== "updated_at") {
          news.push({
            id: `radar-${p.mp_id}-${billId}`,
            title: `Tutka: ${p.mps.first_name} ${p.mps.last_name} – Korkea eturistiriita lakiesityksessä`,
            time: "Tuore havainto",
            type: "radar",
            severity: analysis.score > 80 ? "high" : "medium",
            meta: { mp_id: p.mp_id, score: analysis.score, bill_id: billId }
          });
        }
      });
    });
  }

  // 3. Fetch Integrity Alerts (Takinkääntö)
  const { data: integrityAlerts } = await supabase
    .from("integrity_alerts")
    .select(`
      id,
      mp_id,
      category,
      severity,
      created_at,
      mps (first_name, last_name)
    `)
    .order("created_at", { ascending: false })
    .limit(5);

  if (integrityAlerts) {
    integrityAlerts.forEach((a: any) => {
      news.push({
        id: `alert-${a.id}`,
        title: `Hälytys: ${a.mps.first_name} ${a.mps.last_name} – ${a.category}`,
        time: "Tänään",
        type: "alert",
        severity: a.severity as any
      });
    });
  }

  // Sort by some logic (here just reverse for now)
  return news.sort((a, b) => (a.type === "radar" || a.type === "alert" ? -1 : 1));
}

