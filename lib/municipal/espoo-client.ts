import { createClient } from "@supabase/supabase-js";

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

export async function fetchLatestEspooIssues(limit: number = 20): Promise<EspooIssue[]> {
  try {
    console.log(`--- Fetching latest ${limit} issues from Espoo (Simulated) ---`);
    
    const mockData: EspooIssue[] = [
      {
        id: "ESP-2026-001",
        title: "Keskuspuiston kehittäminen ja luonnonsuojelualueiden laajentaminen",
        summary: "Päätösesitys Keskuspuiston virkistyskäytön lisäämisestä ja luontoarvojen turvaamisesta.",
        proposer: "Kaupunkisuunnittelulautakunta",
        modified: new Date().toISOString(),
        category: "Ympäristö"
      },
      {
        id: "ESP-2026-002",
        title: "Länsiväylän bussikaistojen muuttaminen monitoimikaistoiksi",
        summary: "Kokeilu liikenteen sujuvoittamiseksi ruuhka-aikoina.",
        proposer: "Tekninen lautakunta",
        modified: new Date().toISOString(),
        category: "Liikenne"
      }
    ];
    
    return mockData;
  } catch (error) {
    console.error("Failed to fetch Espoo issues:", error);
    return [];
  }
}

export async function fetchEspooCouncilors() {
  try {
    console.log("--- Fetching Espoo Councilors (Simulated) ---");
    return [
      { name: "Kai Mykkänen", party: "KOK", role: "Valtuuston puheenjohtaja" },
      { name: "Mervi Katainen", party: "KOK", role: "Kaupunginhallituksen puheenjohtaja" }
    ];
  } catch (error) {
    console.error("Failed to fetch Espoo councilors:", error);
    return [];
  }
}
