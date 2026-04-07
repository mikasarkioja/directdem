import Parser from "rss-parser";

const parser = new Parser();

/**
 * Espoo API client for fetching municipal decisions and issues.
 */

export interface EspooIssue {
  id: string;
  title: string;
  summary: string;
  proposer: string | null;
  modified: string;
  category: string;
}

const RSS_URL =
  "https://espoo.oncloudos.com/cgi/DREQUEST.PHP?page=rss/meetingitems&show=50";

function toIsoDate(raw: string | undefined): string {
  if (!raw) return new Date().toISOString();
  const d = new Date(raw);
  return Number.isFinite(d.getTime())
    ? d.toISOString()
    : new Date().toISOString();
}

/**
 * Fetches latest issues from Espoo Dynasty RSS.
 * Uses the newest RSS rows first (no strict keyword filter) so data stays current;
 * optional keyword filter only narrows when explicitly needed.
 */
export async function fetchLatestEspooIssues(
  limit: number = 20,
  opts?: { keywordFilter?: boolean },
): Promise<EspooIssue[]> {
  console.log(`--- Fetching latest ${limit} issues from Espoo RSS ---`);

  try {
    const feed = await parser.parseURL(RSS_URL);
    let items = feed.items ?? [];

    if (opts?.keywordFilter) {
      items = items.filter((item) => {
        const title = (item.title || "").toLowerCase();
        const snippet = (item.contentSnippet || "").toLowerCase();
        return (
          title.includes("valtuusto") ||
          title.includes("hallitus") ||
          snippet.includes("päätös")
        );
      });
    }

    if (items.length === 0) {
      console.warn(
        "[Espoo RSS] No items after fetch/filter — check feed URL or network.",
      );
      return [];
    }

    return items.slice(0, limit).map((item) => ({
      id:
        item.link ||
        (typeof item.guid === "string" ? item.guid : "") ||
        `espoo-rss-${item.title}-${item.pubDate}`,
      title: item.title || "Nimetön asia",
      summary: item.contentSnippet || item.content || item.title || "",
      proposer: extractProposer(item.title, item.contentSnippet),
      modified: toIsoDate(item.pubDate),
      category: "Kuntapolitiikka",
    }));
  } catch (error) {
    console.warn("Failed to fetch Espoo RSS:", error);
    return [];
  }
}

/** Best-effort committee / body label from title line */
function extractProposer(
  title: string | undefined,
  snippet: string | undefined,
): string | null {
  const t = (title || "").trim();
  const louk = /lautakunta|valtuusto|hallitus|neuvosto/i;
  if (louk.test(t)) {
    const parts = t.split(/[–\-|]/);
    const tail = parts[parts.length - 1]?.trim();
    if (tail && louk.test(tail)) return tail;
  }
  return "Espoon kaupunki";
}

export async function fetchEspooCouncilors() {
  try {
    console.log("--- Fetching Espoo Councilors (Simulated) ---");
    return [
      {
        name: "Kai Mykkänen",
        party: "KOK",
        role: "Valtuuston puheenjohtaja",
      },
      {
        name: "Mervi Katainen",
        party: "KOK",
        role: "Kaupunginhallituksen puheenjohtaja",
      },
    ];
  } catch (error) {
    console.error("Failed to fetch Espoo councilors:", error);
    return [];
  }
}
