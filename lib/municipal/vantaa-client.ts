import { createClient } from "@supabase/supabase-js";

/**
 * Vantaa API client for fetching municipal decisions and issues.
 */

export interface VantaaIssue {
  id: string;
  title: string;
  summary: string;
  proposer: string | null;
  modified: string;
  category: string;
}

export async function fetchLatestVantaaIssues(limit: number = 20): Promise<VantaaIssue[]> {
  try {
    console.log(`--- Fetching latest ${limit} issues from Vantaa (Simulated) ---`);
    
    const mockData: VantaaIssue[] = [
      {
        id: "VAN-2026-001",
        title: "Tikkurilan uuden monitoimikeskuksen rahoitus",
        summary: "Investointipäätös kaupungin uuden palvelu- ja vapaa-ajankeskuksen rakentamisesta.",
        proposer: "Kaupunginhallitus",
        modified: new Date().toISOString(),
        category: "Investoinnit"
      },
      {
        id: "VAN-2026-002",
        title: "Kouluverkon tiivistäminen ja uusien oppimisympäristöjen kehittäminen",
        summary: "Suunnitelma perusopetuksen tilojen tehostamisesta.",
        proposer: "Sivistyslautakunta",
        modified: new Date().toISOString(),
        category: "Koulutus"
      }
    ];

    return mockData;
  } catch (error) {
    console.error("Failed to fetch Vantaa issues:", error);
    return [];
  }
}

export async function fetchVantaaCouncilors() {
  try {
    console.log("--- Fetching Vantaa Councilors (Simulated) ---");
    return [
      { name: "Pekka Timonen", party: "IND", role: "Kaupunginjohtaja" },
      { name: "Antti Lindtman", party: "SDP", role: "Valtuuston jäsen" }
    ];
  } catch (error) {
    console.error("Failed to fetch Vantaa councilors:", error);
    return [];
  }
}
