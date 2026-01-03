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
    try {
      const url = `${this.baseUrl}/agenda_item/?limit=${limit}&order_by=-id`;
      const response = await fetch(url, {
        next: { revalidate: 3600 },
        headers: { "Accept": "application/json" }
      });

      if (!response.ok) {
        throw new Error(`Espoo API error: ${response.status}`);
      }

      const data = await response.json();
      const objects = data.objects || [];

      return objects.map((item: any) => ({
        id: item.id.toString(),
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
      console.error("Failed to fetch from Espoo API:", error);
      return [];
    }
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

