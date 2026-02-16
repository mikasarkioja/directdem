import axios from "axios";
import * as cheerio from "cheerio";

const SCRAPER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "fi-FI,fi;q=0.9,en-US;q=0.8,en;q=0.7",
};

export enum DynastyDocType {
  MEETING_MINUTES = "MEETING_MINUTES",
  MEETING_ITEM = "MEETING_ITEM",
  ANNOUNCEMENT = "ANNOUNCEMENT",
  UNKNOWN = "UNKNOWN",
}

export interface DynastyLink {
  title: string;
  url: string;
  type: DynastyDocType;
  dateHint: string;
  pdfUrl?: string;
}

export interface DynastyContent {
  title: string;
  description: string; // Selostus
  proposal: string; // Päätösehdotus
  url: string;
  date?: string;
  pdfUrl?: string;
  municipality: string;
}

/**
 * Parses a Dynasty URL to determine its document type.
 */
function parseDynastyUrl(url: string, text: string): DynastyDocType {
  const lowerUrl = url.toLowerCase();
  const lowerText = text.toLowerCase();

  if (
    lowerUrl.includes("meeting_minutes") ||
    lowerUrl.includes("pöytäkirja") ||
    lowerText.includes("pöytäkirja")
  ) {
    return DynastyDocType.MEETING_MINUTES;
  }

  if (
    lowerUrl.includes("meeting_item") ||
    lowerUrl.includes("asia") ||
    lowerText.includes("pykälä")
  ) {
    return DynastyDocType.MEETING_ITEM;
  }

  if (lowerUrl.includes("announcement") || lowerUrl.includes("ilmoitus")) {
    return DynastyDocType.ANNOUNCEMENT;
  }

  return DynastyDocType.UNKNOWN;
}

/**
 * 1. Hakulogiikka: Etsi linkit Espoon Dynasty-etusivulta.
 */
export async function fetchEspooDynastyLinks(
  baseUrl: string = "https://espoo.oncloudos.com/cgi/DREQUEST.PHP?page=meetings&id=1",
): Promise<DynastyLink[]> {
  console.log(`🔗 Haetaan linkit Dynasty-sivulta: ${baseUrl}`);

  try {
    const response = await axios.get(baseUrl, {
      timeout: 15000,
      headers: SCRAPER_HEADERS,
      validateStatus: (status) => true, // Don't throw on 403/404
    });

    if (response.status !== 200) {
      console.error(
        `❌ Dynasty error: Status ${response.status} for ${baseUrl}`,
      );
      return [];
    }

    const { data } = response;
    const $ = cheerio.load(data);
    const links: DynastyLink[] = [];

    $("a").each((i, el) => {
      const href = $(el).attr("href");
      const text = $(el).text().trim();

      if (!href) return;

      const fullUrl = href.startsWith("http")
        ? href
        : new URL(href, "https://espoo.oncloudos.com/cgi/").toString();
      const type = parseDynastyUrl(fullUrl, text);

      if (type === DynastyDocType.MEETING_MINUTES) {
        links.push({
          title: `Valtuuston kokous ${text}`,
          url: fullUrl,
          type,
          dateHint: text.match(/\d{1,2}\.\d{1,2}\.\d{4}/)?.[0] || "",
        });
      }
    });

    return links;
  } catch (err: any) {
    console.error(`❌ Virhe haettaessa Dynasty-linkkejä: ${err.message}`);
    return [];
  }
}

/**
 * Hakee yksittäisen kokouksen kaikki asiat (pykälät) ja PDF-linkit.
 */
export async function fetchMeetingItems(
  meetingUrl: string,
): Promise<DynastyLink[]> {
  try {
    const { data } = await axios.get(meetingUrl, {
      timeout: 15000,
      headers: SCRAPER_HEADERS,
    });
    const $ = cheerio.load(data);
    const items: DynastyLink[] = [];

    $("a").each((i, el) => {
      const href = $(el).attr("href");
      const text = $(el).text().trim();

      if (
        href &&
        (href.toLowerCase().includes("meetingitem") ||
          href.toLowerCase().includes("page=meetingitem"))
      ) {
        const baseUrl = new URL(meetingUrl).origin;
        const cleanHref = href.replace(/^\.\.\//, "/");
        const fullUrl =
          baseUrl + (cleanHref.startsWith("/") ? "" : "/") + cleanHref;

        if (fullUrl.includes("rss/")) return;

        // Etsi PDF-linkki tästä pykälästä jos mahdollista
        let pdfUrl = "";
        const parentRow = $(el).closest("tr");
        const pdfLink = parentRow
          .find("a[href*='.pdf'], a[href*='page=pdf']")
          .attr("href");
        if (pdfLink) {
          pdfUrl = pdfLink.startsWith("http")
            ? pdfLink
            : baseUrl + (pdfLink.startsWith("/") ? "" : "/") + pdfLink;
        }

        items.push({
          title: text,
          url: fullUrl,
          type: DynastyDocType.MEETING_ITEM,
          dateHint: "",
          pdfUrl,
        });
      }
    });

    return items;
  } catch (err: any) {
    console.error(`⚠️ Virhe noudettaessa kokouksen asioita: ${err.message}`);
    return [];
  }
}

/**
 * Nouda ja jäsennä HTML-sisältö.
 */
export async function fetchDynastyContent(
  link: DynastyLink,
): Promise<DynastyContent | null> {
  try {
    const { data } = await axios.get(link.url, {
      timeout: 15000,
      headers: SCRAPER_HEADERS,
    });
    const $ = cheerio.load(data);

    let description = "";
    let proposal = "";

    const fullHtml = $(".data-part-block-htm").html() || "";
    const $content = cheerio.load(fullHtml);

    $content("h2, h3, b, strong").each((i, el) => {
      const titleText = $(el).text().toLowerCase();
      const content = $(el).nextUntil("h2, h3, b, strong").text().trim();

      if (titleText.includes("selostus") || titleText.includes("kuvaus")) {
        description = content;
      } else if (
        titleText.includes("päätösehdotus") ||
        titleText.includes("ehdotus") ||
        titleText.includes("päätös")
      ) {
        proposal = content;
      }
    });

    if (!description && !proposal) {
      description = $(".data-part-block-htm").text().trim();
    }

    return {
      title: link.title,
      description,
      proposal,
      url: link.url,
      pdfUrl: link.pdfUrl,
      municipality: "Espoo",
    };
  } catch (err: any) {
    console.error(`⚠️ Virhe noudettaessa sisältöä: ${err.message}`);
    return null;
  }
}
