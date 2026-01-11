import axios from "axios";
import * as cheerio from "cheerio";

export enum DynastyDocType {
  MEETING_MINUTES = "MEETING_MINUTES",
  MEETING_ITEM = "MEETING_ITEM",
  ANNOUNCEMENT = "ANNOUNCEMENT",
  UNKNOWN = "UNKNOWN"
}

export interface DynastyLink {
  title: string;
  url: string;
  type: DynastyDocType;
  dateHint: string;
}

export interface DynastyContent {
  title: string;
  description: string; // Selostus
  proposal: string;    // Päätösehdotus
  url: string;
  date?: string;
}

/**
 * Parses a Dynasty URL to determine its document type.
 */
function parseDynastyUrl(url: string, text: string): DynastyDocType {
  const lowerUrl = url.toLowerCase();
  const lowerText = text.toLowerCase();

  if (lowerUrl.includes("meeting_minutes") || lowerUrl.includes("pöytäkirja") || lowerText.includes("pöytäkirja")) {
    return DynastyDocType.MEETING_MINUTES;
  }
  
  if (lowerUrl.includes("meeting_item") || lowerUrl.includes("asia") || lowerText.includes("pykälä")) {
    return DynastyDocType.MEETING_ITEM;
  }

  if (lowerUrl.includes("announcement") || lowerUrl.includes("ilmoitus")) {
    return DynastyDocType.ANNOUNCEMENT;
  }

  return DynastyDocType.UNKNOWN;
}

/**
 * 1. Hakulogiikka: Etsi linkit Espoon Dynasty-etusivulta.
 * Käytetään nyt suoraan kaupunginvaltuuston ID:tä (1).
 */
export async function fetchEspooDynastyLinks(baseUrl: string = "https://espoo.oncloudos.com/cgi/DREQUEST.PHP?page=meetings&id=1"): Promise<DynastyLink[]> {
  console.log(`🔗 Haetaan linkit Dynasty-sivulta: ${baseUrl}`);
  
  try {
    const { data } = await axios.get(baseUrl, { timeout: 15000 });
    const $ = cheerio.load(data);
    const links: DynastyLink[] = [];

    $("a").each((i, el) => {
      const href = $(el).attr("href");
      const text = $(el).text().trim();
      
      if (!href) return;

      // Korjataan suhteelliset linkit
      const fullUrl = href.startsWith("http") ? href : new URL(href, "https://espoo.oncloudos.com/cgi/").toString();
      
      // Dynasty-linkit ovat usein muotoa page=meeting&id=...
      const type = parseDynastyUrl(fullUrl, text);

      if (type === DynastyDocType.MEETING_MINUTES) {
        links.push({
          title: `Valtuuston kokous ${text}`,
          url: fullUrl,
          type,
          dateHint: text.match(/\d{1,2}\.\d{1,2}\.\d{4}/)?.[0] || ""
        });
      }
    });

    console.log(`✅ Löydetty ${links.length} valtuuston pöytäkirjaa.`);
    return links;
  } catch (err: any) {
    console.error(`❌ Virhe haettaessa Dynasty-linkkejä: ${err.message}`);
    return [];
  }
}

/**
 * Hakee yksittäisen kokouksen kaikki asiat (pykälät).
 */
export async function fetchMeetingItems(meetingUrl: string): Promise<DynastyLink[]> {
  console.log(`📂 Haetaan kokouksen asiat: ${meetingUrl}`);
  try {
    const { data } = await axios.get(meetingUrl, { timeout: 15000 });
    const $ = cheerio.load(data);
    const items: DynastyLink[] = [];

    $("a").each((i, el) => {
      const href = $(el).attr("href");
      const text = $(el).text().trim();
      
      if (href && (href.toLowerCase().includes("meetingitem") || href.toLowerCase().includes("page=meetingitem"))) {
        // Korjataan suhteelliset linkit. Dynasty käyttää usein ../cgi/
        let fullUrl = "";
        if (href.startsWith("http")) {
          fullUrl = href;
        } else {
          // Rakennetaan absoluuttinen URL perustuen palvelimeen
          const baseUrl = new URL(meetingUrl).origin;
          // Jos href alkaa ../cgi/, se on suhteessa /cgi/ kansioon tai juureen
          // Useimmiten Dynasty-palvelimilla se on /cgi/DREQUEST.PHP
          const cleanHref = href.replace(/^\.\.\//, "/");
          fullUrl = baseUrl + (cleanHref.startsWith("/") ? "" : "/") + cleanHref;
        }

        // Suodatetaan pois RSS-linkit, jotka sisältävät meetingitem-sanan
        if (fullUrl.includes("rss/")) return;

        items.push({
          title: text,
          url: fullUrl,
          type: DynastyDocType.MEETING_ITEM,
          dateHint: ""
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
 * 3. Datan haku: Nouda ja jäsennä HTML-sisältö.
 */
export async function fetchDynastyContent(link: DynastyLink): Promise<DynastyContent | null> {
  // 4. Virhekäsittely: 2 sekunnin viive (throttle) kutsujen välillä on hoidettava kutsuvassa päässä
  // mutta toteutetaan haku tässä.
  
  console.log(`📄 Haetaan sisältö: ${link.url}`);
  
  try {
    const { data } = await axios.get(link.url, { timeout: 15000 });
    const $ = cheerio.load(data);

    let description = "";
    let proposal = "";

    if (link.type === DynastyDocType.MEETING_ITEM) {
      // Etsitään 'Selostus' ja 'Päätösehdotus' -osiot
      // Dynasty-järjestelmässä koko teksti on usein .data-part-block-htm sisällä
      const fullHtml = $(".data-part-block-htm").html() || "";
      const $content = cheerio.load(fullHtml);

      // Kokeillaan erottaa otsikoiden perusteella
      $content("h2, h3, b, strong").each((i, el) => {
        const titleText = $(el).text().toLowerCase();
        const content = $(el).nextUntil("h2, h3, b, strong").text().trim();

        if (titleText.includes("selostus") || titleText.includes("kuvaus")) {
          description = content;
        } else if (titleText.includes("päätösehdotus") || titleText.includes("ehdotus") || titleText.includes("päätös")) {
          proposal = content;
        }
      });

      // Jos ei löytynyt osioita, otetaan koko teksti
      if (!description && !proposal) {
        description = $(".data-part-block-htm").text().trim();
      }
    } else {
      // MEETING_MINUTES tai muut: haetaan .data-part-block-htm tai koko body
      description = $(".data-part-block-htm").text().trim() || $("#main-content, .article-content, .meeting-content").text().trim();
    }

    return {
      title: link.title,
      description,
      proposal,
      url: link.url
    };
  } catch (err: any) {
    console.error(`⚠️ Virhe noudettaessa sisältöä kohteesta ${link.url}: ${err.message}`);
    return null;
  }
}

/**
 * Throttled haku kaikille linkeille.
 */
export async function scrapeEspooWithThrottle(links: DynastyLink[]) {
  const results: DynastyContent[] = [];
  
  for (const link of links) {
    const content = await fetchDynastyContent(link);
    if (content) {
      results.push(content);
    }
    
    console.log("⏳ Odotetaan 2 sekuntia ennen seuraavaa hakua...");
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return results;
}
