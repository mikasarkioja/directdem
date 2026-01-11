import Parser from "rss-parser";

/**
 * Municipal API Fetcher
 * 
 * Fetches agenda items and decisions from Finnish municipalities.
 * Integration: Espoo Dynasty RSS, Helsinki Ahjo, Kuntalaisaloite.
 */

export interface MunicipalAgendaItem {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  status: string;
  meetingDate?: string;
  orgName?: string;
  url?: string;
  municipality: string;
}

const parser = new Parser();

/**
 * Base class for municipal APIs
 */
export abstract class MunicipalAPI {
  abstract municipalityName: string;
  abstract fetchLatestItems(limit?: number): Promise<MunicipalAgendaItem[]>;
}

/**
 * Espoo implementation using Dynasty RSS feeds (Official Kuntavahti)
 */
export class EspooAPI extends MunicipalAPI {
  municipalityName = "Espoo";
  private meetingItemsRss = "https://espoo.oncloudos.com/cgi/DREQUEST.PHP?page=rss/meetingitems&show=30";
  
  async fetchLatestItems(limit: number = 10): Promise<MunicipalAgendaItem[]> {
    console.log(`[EspooAPI] Fetching items from Espoo Dynasty RSS...`);
    try {
      const feed = await parser.parseURL(this.meetingItemsRss);
      
      // SUODATUS-logiikka: Poimi vain kohteet, joiden otsikossa tai kuvauksessa on "Kaupunginvaltuusto"
      const filteredItems = feed.items.filter(item => {
        const title = (item.title || "").toLowerCase();
        const snippet = (item.contentSnippet || "").toLowerCase();
        const content = (item.content || "").toLowerCase();
        
        return title.includes("kaupunginvaltuusto") || 
               snippet.includes("kaupunginvaltuusto") || 
               content.includes("kaupunginvaltuusto");
      });

      console.log(`[EspooAPI] RSS sync: Found ${filteredItems.length} council items out of ${feed.items.length}`);

      if (filteredItems.length === 0) {
        // If no fresh items found, try to return mock data for development
        return this.getMockItems();
      }

      return filteredItems.slice(0, limit).map(item => ({
        // RSS-linkkiä käytetään uniikkina tunnisteena duplikaattien estämiseksi
        id: item.link || Math.random().toString(),
        title: item.title || "Nimetön asia",
        summary: item.contentSnippet || item.title,
        content: item.content || item.contentSnippet,
        status: "agenda",
        meetingDate: item.pubDate,
        orgName: "Kaupunginvaltuusto",
        url: item.link,
        municipality: this.municipalityName
      }));
    } catch (error: any) {
      console.error("[EspooAPI] RSS fetch failed:", error.message);
      return this.getMockItems();
    }
  }

  private getMockItems(): MunicipalAgendaItem[] {
    console.log("[EspooAPI] Returning realistic mock items as fallback");
    return [
      {
        id: "mock-espoo-1",
        title: "Keskuspuhdistamon laajennus ja modernisointi (Kaupunginvaltuusto)",
        summary: "Päätös Blominmäen jätevedenpuhdistamon kapasiteetin nostamisesta vastaamaan kasvavaa asukasmäärää.",
        content: "Kaupunginvaltuusto päätti hyväksyä suunnitelman laajentaa puhdistamoa...",
        status: "decided",
        meetingDate: "2026-01-03T10:00:00Z",
        orgName: "Kaupunginvaltuusto",
        municipality: "Espoo"
      },
      {
        id: "mock-espoo-2",
        title: "Länsiväylän meluaitojen toteuttaminen (Kaupunginvaltuusto)",
        summary: "Espoon kaupunki antaa lausunnon Länsiväylän parantamisen ympäristövaikutuksista Tapiolan kohdalla.",
        content: "Kaupunginvaltuusto käsittelee hankkeen toteutussuunnitelmaa...",
        status: "agenda",
        meetingDate: "2026-01-15T17:00:00Z",
        orgName: "Kaupunginvaltuusto",
        municipality: "Espoo"
      }
    ];
  }
}

/**
 * Helsinki implementation using the Ahjo API (very stable)
 */
export class HelsinkiAPI extends MunicipalAPI {
  municipalityName = "Helsinki";
  private baseUrl = "https://paatokset.hel.fi/helsinki/ahjo/v1";

  async fetchLatestItems(limit: number = 10): Promise<MunicipalAgendaItem[]> {
    console.log(`[HelsinkiAPI] Fetching latest items from Helsinki, limit: ${limit}`);
    
    // Helsingin Ahjo API saattaa vaihdella endpointien osalta
    const endpoints = [
      `${this.baseUrl}/agenda_item/?limit=${limit}`,
      `${this.baseUrl}/issue/?limit=${limit}`,
      `https://dev.hel.fi/paatokset/v1/agenda_item/?limit=${limit}`
    ];

    for (const url of endpoints) {
      try {
        console.log(`[HelsinkiAPI] Trying endpoint: ${url}`);
        const response = await fetch(url, {
          next: { revalidate: 3600 },
          headers: { "Accept": "application/json" },
          signal: AbortSignal.timeout(8000)
        });

        if (response.ok) {
          const data = await response.json();
          const objects = data.objects || data.items || (Array.isArray(data) ? data : []);
          
          if (objects.length > 0) {
            console.log(`[HelsinkiAPI] Successfully fetched ${objects.length} items from ${url}`);
            return objects.map((item: any) => ({
              id: (item.id || item.native_id || Math.random()).toString(),
              title: item.title || item.subject || item.name || "Nimetön asia",
              summary: item.preamble || item.abstract || item.title || item.subject || "",
              content: item.resolution || item.content || item.text || "",
              status: item.decision_status || item.status || "agenda",
              meetingDate: item.meeting?.date || item.meeting_date || item.date || item.created,
              orgName: item.organization_name || item.council_name || "Helsingin kaupunki",
              url: item.permalink || item.html_url || item.origin_url,
              municipality: this.municipalityName
            }));
          }
        } else {
          console.warn(`[HelsinkiAPI] Endpoint ${url} returned status ${response.status}`);
        }
      } catch (error: any) {
        console.warn(`[HelsinkiAPI] Endpoint ${url} failed:`, error.message);
      }
    }

    console.error("[HelsinkiAPI] All Helsinki endpoints failed");
    return this.getMockItems();
  }

  private getMockItems(): MunicipalAgendaItem[] {
    console.log("[HelsinkiAPI] Returning realistic Helsinki mock items as fallback");
    return [
      {
        id: "mock-hel-1",
        title: "Kaisaniemen puiston peruskorjaus",
        summary: "Kaupunkiympäristölautakunta käsittelee historiallisen puiston kunnostussuunnitelmaa.",
        content: "Suunnitelma sisältää uusien valaisimien ja penkkien asentamisen...",
        status: "agenda",
        meetingDate: "2026-01-10T15:00:00Z",
        orgName: "Kaupunkiympäristölautakunta",
        municipality: "Helsinki"
      },
      {
        id: "mock-hel-2",
        title: "Helsingin päärautatieaseman ympäristön liikennejärjestelyt",
        summary: "Päätös uusista pyöräilyreiteistä ja jalankulun sujuvoittamisesta keskustassa.",
        content: "Keskuskatu muutetaan kokonaan kävelykaduksi...",
        status: "decided",
        meetingDate: "2026-01-05T10:00:00Z",
        orgName: "Kaupunginhallitus",
        municipality: "Helsinki"
      }
    ];
  }
}

/**
 * Kuntalaisaloite.fi implementation (Always live and real data)
 */
export class KuntalaisaloiteAPI extends MunicipalAPI {
  municipalityName = "Aloitteet";
  private baseUrl = "https://www.kuntalaisaloite.fi/api/v1";

  async fetchLatestItems(limit: number = 10): Promise<MunicipalAgendaItem[]> {
    try {
      const url = `${this.baseUrl}/initiatives?limit=${limit}`;
      const response = await fetch(url, {
        next: { revalidate: 3600 },
        headers: { "Accept": "application/json" }
      });

      if (!response.ok) throw new Error(`Kuntalaisaloite API error: ${response.status}`);

      const data = await response.json();
      
      return data.map((item: any) => ({
        id: `aloite-${item.id.split('/').pop()}`,
        title: item.name,
        summary: `Kuntalaisaloite: ${item.name}. ${item.participantCount} osallistujaa.`,
        content: `Tämä on kuntalaisaloite, joka on jätetty ${item.municipality.nameFi}n kunnalle.`,
        status: "agenda",
        meetingDate: item.publishDate,
        orgName: `Kuntalaisaloite: ${item.municipality.nameFi}`,
        url: item.url.fi,
        municipality: item.municipality.nameFi
      }));
    } catch (error) {
      console.error("Failed to fetch from Kuntalaisaloite API:", error);
      return [];
    }
  }
}

/**
 * Vantaa implementation using RSS
 */
export class VantaaAPI extends MunicipalAPI {
  municipalityName = "Vantaa";
  private rssUrl = "https://www.vantaa.fi/fi/rss.xml";

  async fetchLatestItems(limit: number = 10): Promise<MunicipalAgendaItem[]> {
    console.log(`[VantaaAPI] Fetching items from Vantaa RSS...`);
    try {
      const feed = await parser.parseURL(this.rssUrl);
      
      const filteredItems = feed.items.filter(item => {
        const title = (item.title || "").toLowerCase();
        const snippet = (item.contentSnippet || "").toLowerCase();
        
        return title.includes("päätös") || 
               title.includes("valtuusto") || 
               snippet.includes("valtuusto");
      });

      console.log(`[VantaaAPI] RSS sync: Found ${filteredItems.length} items`);

      if (filteredItems.length === 0) {
        return this.getMockItems();
      }

      return filteredItems.slice(0, limit).map(item => ({
        id: item.link || Math.random().toString(),
        title: item.title || "Nimetön asia",
        summary: item.contentSnippet || item.title,
        content: item.content || item.contentSnippet,
        status: "agenda",
        meetingDate: item.pubDate,
        orgName: "Kaupunginvaltuusto",
        url: item.link,
        municipality: this.municipalityName
      }));
    } catch (error: any) {
      console.error("[VantaaAPI] RSS fetch failed:", error.message);
      return this.getMockItems();
    }
  }

  private getMockItems(): MunicipalAgendaItem[] {
    return [
      {
        id: "mock-vantaa-1",
        title: "Tikkurilan osaamiskampuksen rakentaminen",
        summary: "Vantaan kaupunginvaltuusto hyväksyi hankesuunnitelman uudesta kampusalueesta.",
        content: "Kampus palvelee tulevaisuudessa tuhansia opiskelijoita...",
        status: "decided",
        meetingDate: "2026-01-08T10:00:00Z",
        orgName: "Kaupunginvaltuusto",
        municipality: "Vantaa"
      },
      {
        id: "mock-vantaa-2",
        title: "Vantaan ratikka: Reittisuunnitelman päivitys",
        summary: "Keskustelu ratikan itäisen jatkeen vaikutuksista asuinalueisiin.",
        content: "Valtuusto kuulee asiantuntijoita reittivaihtoehdoista...",
        status: "agenda",
        meetingDate: "2026-01-20T17:30:00Z",
        orgName: "Kaupunginvaltuusto",
        municipality: "Vantaa"
      }
    ];
  }
}

/**
 * Helper to get the correct API implementation for a municipality
 */
export function getMunicipalAPI(municipality: string): MunicipalAPI {
  switch (municipality.toLowerCase()) {
    case "espoo":
      return new EspooAPI();
    case "helsinki":
      return new HelsinkiAPI();
    case "vantaa":
      return new VantaaAPI();
    case "aloitteet":
      return new KuntalaisaloiteAPI();
    default:
      return new EspooAPI();
  }
}

