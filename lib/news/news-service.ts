import Parser from "rss-parser";

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet: string;
  source: string;
}

const parser = new Parser();

export async function getLatestNews(): Promise<NewsItem[]> {
  try {
    // Next.js 15: Fetch with revalidation (900 seconds = 15 minutes)
    const res = await fetch("https://yle.fi/a/64-123/rss", {
      next: { revalidate: 900 },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch RSS: ${res.statusText}`);
    }

    const xml = await res.text();
    const feed = await parser.parseString(xml);

    return (feed.items || []).map((item) => ({
      title: item.title || "Ei otsikkoa",
      link: item.link || "#",
      pubDate: item.pubDate || new Date().toISOString(),
      contentSnippet: item.contentSnippet || "",
      source: "Yle Uutiset",
    }));
  } catch (error) {
    console.error("News fetch error:", error);
    return [];
  }
}


