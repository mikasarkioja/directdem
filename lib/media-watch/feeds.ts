import Parser from "rss-parser";

const parser = new Parser();

export type FetchedNewsItem = {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet: string;
  sourceName: string;
};

export const MEDIA_RSS_FEEDS: { url: string; sourceName: string }[] = [
  {
    url: "https://feeds.yle.fi/uutiset/v1/recent.rss?publisherIds=YLE_UUTISET&categories=64-123",
    sourceName: "Yle Politiikka",
  },
  {
    url: "https://feeds.yle.fi/uutiset/v1/recent.rss?publisherIds=YLE_UUTISET",
    sourceName: "Yle Tuoreimmat",
  },
  { url: "https://yle.fi/uutiset/rss", sourceName: "Yle RSS" },
  {
    url: "https://www.hs.fi/rss/tuoreimmat/uutiset.xml",
    sourceName: "Helsingin Sanomat",
  },
  { url: "https://www.is.fi/rss/uutiset.xml", sourceName: "Ilta-Sanomat" },
];

async function fetchFeedXml(url: string): Promise<string> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 0 },
      headers: {
        "User-Agent":
          "DirectDem-MediaWatch/1.0 (Eduskuntavahti; +https://github.com)",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
    });
    if (!res.ok) {
      throw new Error(`RSS ${res.status} ${res.statusText}`);
    }
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

export async function fetchAllMediaRssItems(
  maxPerFeed = 35,
): Promise<FetchedNewsItem[]> {
  const out: FetchedNewsItem[] = [];
  const seen = new Set<string>();

  for (const { url, sourceName } of MEDIA_RSS_FEEDS) {
    try {
      const xml = await fetchFeedXml(url);
      if (xml.length < 80) continue;
      const feed = await parser.parseString(xml);
      for (const item of feed.items?.slice(0, maxPerFeed) || []) {
        const link = (item.link || item.guid || "").toString().trim();
        if (!link || seen.has(link)) continue;
        seen.add(link);
        out.push({
          title: (item.title || "Ei otsikkoa").toString().trim(),
          link,
          pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
          contentSnippet: (item.contentSnippet || item.summary || "")
            .toString()
            .trim(),
          sourceName,
        });
      }
    } catch (e) {
      console.warn(`[MediaWatch] RSS epäonnistui ${url}:`, e);
    }
  }

  return out;
}
