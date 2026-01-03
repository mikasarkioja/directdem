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
    console.log(`[EspooAPI] Fetching latest items, limit: ${limit}`);
    try {
      // Try with a slightly simpler URL first
      const url = `${this.baseUrl}/agenda_item/?limit=${limit}`;
      console.log(`[EspooAPI] Fetching from: ${url}`);
      
      const response = await fetch(url, {
        next: { revalidate: 3600 },
        headers: { "Accept": "application/json" }
      });

      console.log(`[EspooAPI] Response status: ${response.status}`);

      if (!response.ok) {
        console.warn(`[EspooAPI] API returned error: ${response.status}`);
        return this.getMockItems(); // Fallback to mock items
      }

      const data = await response.json();
      const objects = data.objects || [];
      console.log(`[EspooAPI] Found ${objects.length} items`);

      if (objects.length === 0) {
        return this.getMockItems(); // Fallback if no items found
      }

      return objects.map((item: any) => ({
        id: item.id?.toString() || Math.random().toString(),
        title: item.title || "Nimetön asia",
        summary: item.preamble || item.title,
        content: item.resolution || item.content,
        status: item.decision_status || "agenda",
        meetingDate: item.meeting?.date,
        orgName: item.organization?.name,
        url: item.origin_url,
        municipality: this.municipalityName
      }));
    } catch (error) {
      console.error("[EspooAPI] Failed to fetch from Espoo API:", error);
      return this.getMockItems(); // Fallback to mock items
    }
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

