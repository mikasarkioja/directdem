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
    console.log("[EspooAPI] Returning mock items as fallback");
    return [
      {
        id: "mock-1",
        title: "Keskuspuhdistamon laajennus ja modernisointi",
        summary: "Päätös Blominmäen jätevedenpuhdistamon kapasiteetin nostamisesta vastaamaan kasvavaa asukasmäärää.",
        content: "Kaupunginhallitus päätti hyväksyä suunnitelman laajentaa puhdistamoa...",
        status: "decided",
        meetingDate: new Date().toISOString(),
        orgName: "Kaupunginhallitus",
        municipality: "Espoo"
      },
      {
        id: "mock-2",
        title: "Uuden koulukeskuksen rakentaminen Leppävaaraan",
        summary: "Suunnitelma uuden monitoimitalon ja yhtenäiskoulun rakentamiseksi vanhan purettavan koulun tilalle.",
        content: "Opetus- ja varhaiskasvatuslautakunta esittää valtuustolle...",
        status: "agenda",
        meetingDate: new Date(Date.now() + 86400000 * 7).toISOString(),
        orgName: "Valtuusto",
        municipality: "Espoo"
      },
      {
        id: "mock-3",
        title: "Pyöräilybaanan rakentaminen Länsiväylän suuntaisesti",
        summary: "Hanke edistää kestävä liikkumista rakentamalla laadukkaan pyörätien Tapiolan ja Helsingin välille.",
        content: "Tekninen lautakunta käsittelee urakkatarjouksia...",
        status: "agenda",
        meetingDate: new Date(Date.now() + 86400000 * 3).toISOString(),
        orgName: "Tekninen lautakunta",
        municipality: "Espoo"
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
    default:
      throw new Error(`Municipality ${municipality} not supported yet.`);
  }
}

