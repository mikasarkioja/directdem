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
    // Standard Yle Politiikka RSS feed
    const RSS_URL =
      "https://feeds.yle.fi/uutiset/v1/recent.rss?publisherIds=YLE_UUTISET&categories=64-123";

    // Next.js 15: Fetch with revalidation (900 seconds = 15 minutes)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const res = await fetch(RSS_URL, {
      next: { revalidate: 900 },
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/rss+xml, application/xml, text/xml",
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Failed to fetch RSS: ${res.statusText}`);
    }

    const xml = await res.text();
    console.log(`[getLatestNews] Received XML, length: ${xml.length}`);

    if (xml.length < 100) {
      console.warn(
        "[getLatestNews] XML content too short, might be blocked or empty",
      );
      return [];
    }

    const feed = await parser.parseString(xml);
    console.log(
      `[getLatestNews] Parsed feed, items: ${feed.items?.length || 0}`,
    );

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
