/**
 * Municipal API Fetcher
 * 
 * Fetches agenda items and decisions from Finnish municipalities.
 * Default implementation: Espoo (paatokset.espoo.fi)
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

/**
 * Base class for municipal APIs to allow easy expansion to other cities
 */
export abstract class MunicipalAPI {
  abstract municipalityName: string;
  abstract fetchLatestItems(limit?: number): Promise<MunicipalAgendaItem[]>;
}

/**
 * Espoo implementation using the Open Decisions (6Aika) API
 */
export class EspooAPI extends MunicipalAPI {
  municipalityName = "Espoo";
  private baseUrl = "https://paatokset.espoo.fi/api/v1";

  async fetchLatestItems(limit: number = 10): Promise<MunicipalAgendaItem[]> {
    console.log(`[EspooAPI] Fetching latest items from Espoo, limit: ${limit}`);
    
    // Yritetään kahta eri mahdollista rajapintaa
    const endpoints = [
      `${this.baseUrl}/agenda_item/?limit=${limit}`,
      `https://paatokset.espoo.fi/rest/v1/agendas?limit=${limit}`
    ];

    for (const url of endpoints) {
      try {
        console.log(`[EspooAPI] Trying endpoint: ${url}`);
        const response = await fetch(url, {
          next: { revalidate: 3600 },
          headers: { "Accept": "application/json" },
          signal: AbortSignal.timeout(8000)
        });

        if (response.ok) {
          const data = await response.json();
          // Käsitellään eri vastausmuodot (Open Decisions vs Rest API)
          const objects = data.objects || data.items || (Array.isArray(data) ? data : []);
          
          if (objects.length > 0) {
            console.log(`[EspooAPI] Successfully fetched ${objects.length} items from ${url}`);
            return objects.map((item: any) => ({
              id: (item.id || item.native_id || Math.random()).toString(),
              title: item.title || item.subject || "Nimetön asia",
              summary: item.preamble || item.abstract || item.title || item.subject,
              content: item.resolution || item.content || item.text,
              status: item.decision_status || item.status || "agenda",
              meetingDate: item.meeting?.date || item.meeting_date || item.date,
              orgName: item.organization?.name || item.council_name || "Espoon kaupunki",
              url: item.origin_url || item.html_url || item.pdf_url,
              municipality: this.municipalityName
            }));
          }
        }
      } catch (error: any) {
        console.warn(`[EspooAPI] Endpoint ${url} failed:`, error.message);
      }
    }

    console.error("[EspooAPI] All endpoints failed, using mock data");
    return this.getMockItems();
  }

  private getMockItems(): MunicipalAgendaItem[] {
    console.log("[EspooAPI] Returning realistic mock items as fallback");
    return [
      {
        id: "mock-espoo-1",
        title: "Keskuspuhdistamon laajennus ja modernisointi",
        summary: "Päätös Blominmäen jätevedenpuhdistamon kapasiteetin nostamisesta vastaamaan kasvavaa asukasmäärää.",
        content: "Kaupunginhallitus päätti hyväksyä suunnitelman laajentaa puhdistamoa...",
        status: "decided",
        meetingDate: "2026-01-03T10:00:00Z",
        orgName: "Kaupunginhallitus",
        municipality: "Espoo"
      },
      {
        id: "mock-espoo-2",
        title: "Länsiväylän ympäristövaikutusten arviointi (YVA)",
        summary: "Espoon kaupunki antaa lausunnon Länsiväylän parantamisen ympäristövaikutuksista Tapiolan kohdalla.",
        content: "Hankkeella on merkittäviä vaikutuksia kaupunkikuvaan ja melutasoon...",
        status: "agenda",
        meetingDate: "2026-01-15T17:00:00Z",
        orgName: "Kaupunkisuunnittelulautakunta",
        municipality: "Espoo"
      },
      {
        id: "mock-espoo-3",
        title: "Kiviruukin uuden asuinalueen kaavoitus",
        summary: "Kaavaehdotus mahdollistaa asuinkerrostalojen ja palvelujen rakentamisen Finnoon metropysäkin läheisyyteen.",
        content: "Alueelle tavoitellaan hiilineutraalia rakentamista...",
        status: "agenda",
        meetingDate: "2026-01-20T16:00:00Z",
        orgName: "Kaupunginhallitus",
        municipality: "Espoo"
      },
      {
        id: "mock-espoo-4",
        title: "Maksuton joukkoliikenne alle 18-vuotiaille",
        summary: "Aloite maksuttoman HSL-liikenteen tarjoamisesta kaikille espoolaisille nuorille.",
        content: "Kustannusarvio on noin 12 miljoonaa euroa vuodessa...",
        status: "agenda",
        meetingDate: "2026-02-01T18:00:00Z",
        orgName: "Valtuusto",
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
 * Helper to get the correct API implementation for a municipality
 */
export function getMunicipalAPI(municipality: string): MunicipalAPI {
  switch (municipality.toLowerCase()) {
    case "espoo":
      return new EspooAPI();
    case "helsinki":
      return new HelsinkiAPI();
    default:
      // Fallback to Espoo API which handles its own mock data
      return new EspooAPI();
  }
}

