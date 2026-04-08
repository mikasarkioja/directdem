/**
 * Uutishaku manifesteille / demoihin — vain tietokannasta (news_articles).
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export interface NewsItem {
  id: string;
  title: string;
  /** Lähteen nimi tietokannasta */
  source: string;
  url: string;
  publishedAt: string;
}

/**
 * Hakee viimeisimmät rivit `news_articles`-taulusta ja suodattaa kevyesti aiheen mukaan.
 * Ei mock-rivejä: tyhjä lista jos taulu tyhjä tai Supabase puuttuu.
 */
export async function fetchRelevantNews(topic: string): Promise<NewsItem[]> {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  if (!url || !key) return [];

  const supabase = createSupabaseClient(url, key);
  const { data, error } = await supabase
    .from("news_articles")
    .select("id, title, source_url, published_at, source_name, content")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(40);

  if (error || !data?.length) {
    if (error) console.warn("[fetchRelevantNews]", error.message);
    return [];
  }

  const topicWords = topic
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 1);

  const scored = data.filter((row) => {
    if (!topicWords.length) return true;
    const hay = `${row.title} ${row.content || ""}`.toLowerCase();
    return topicWords.some((w) => hay.includes(w));
  });

  const picked = (scored.length ? scored : data).slice(0, 12);

  return picked.map((row) => ({
    id: row.id,
    title: row.title || "Ei otsikkoa",
    source: row.source_name?.trim() || "Uutisaineisto",
    url: row.source_url || "#",
    publishedAt: row.published_at || new Date().toISOString(),
  }));
}
