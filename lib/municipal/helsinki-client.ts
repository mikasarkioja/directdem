import { createClient } from "@supabase/supabase-js";

/**
 * Helsinki API client for fetching municipal decisions and issues.
 * Base URL: https://api.hel.fi/paatokset/v1/
 */

const BASE_URL = "https://ahjo.hel.fi/api/v1";

export interface HelsinkiIssue {
  id: string;
  subject: string;
  summary: string;
  proposer: string | null;
  last_modified: string;
  issue_id: string;
  category: string;
}

export async function fetchLatestHelsinkiIssues(limit: number = 20): Promise<HelsinkiIssue[]> {
  try {
    console.log(`--- Fetching latest ${limit} issues from Helsinki (Simulated) ---`);
    
    // High-quality mock data for Helsinki until the new Ahjo API endpoint is confirmed
    const mockData: HelsinkiIssue[] = [
      {
        id: "HEL-2026-001",
        subject: "Kaisaniemen puiston peruskorjaus ja valaistuksen uusiminen",
        summary: "Suunnitelma puiston turvallisuuden ja viihtyisyyden parantamiseksi.",
        proposer: "Kaupunkiympäristölautakunta",
        last_modified: new Date().toISOString(),
        issue_id: "HEL-2026-001",
        category: "Kaupunkiympäristö"
      },
      {
        id: "HEL-2026-002",
        subject: "Hernesaaren uuden asuinalueen asemakaavamuutos",
        summary: "Päätös uusien asuinkortteleiden rakentamisesta ja merellisen rantapuiston kehittämisestä.",
        proposer: "Kaupunginhallitus",
        last_modified: new Date().toISOString(),
        issue_id: "HEL-2026-002",
        category: "Asuminen"
      }
    ];

    return mockData;
  } catch (error) {
    console.error("Failed to fetch Helsinki issues:", error);
    return [];
  }
}

function processAhjoObjects(results: any[]): HelsinkiIssue[] {
  return (results || []).map((obj: any) => ({
    id: obj.id?.toString() || obj.issue_id || Math.random().toString(),
    subject: obj.subject || obj.title || "Nimetön asia",
    summary: obj.summary || obj.description || "Ei tiivistelmää saatavilla.",
    proposer: obj.proposer || null,
    last_modified: obj.modified || obj.updated_at || new Date().toISOString(),
    issue_id: obj.id?.toString(),
    category: obj.category || "Yleinen"
  }));
}

function processOldObjects(objects: any[]): HelsinkiIssue[] {
  return (objects || []).map((obj: any) => ({
    id: obj.id?.toString() || obj.issue_id || Math.random().toString(),
    subject: obj.subject || "Nimetön asia",
    summary: obj.summary || "Ei tiivistelmää saatavilla.",
    proposer: obj.proposer || null,
    last_modified: obj.last_modified || new Date().toISOString(),
    issue_id: obj.issue_id,
    category: obj.category || "Yleinen"
  }));
}

export async function fetchHelsinkiCouncilors() {
  try {
    console.log("--- Fetching Helsinki Councilors (Simulated) ---");
    // Mocking councilors for Helsinki
    return [
      { name: "Juhana Vartiainen", party: "KOK", role: "Pormestari" },
      { name: "Anni Sinnemäki", party: "VIHR", role: "Apulaispormestari" },
      { name: "Paavo Arhinmäki", party: "VAS", role: "Apulaispormestari" }
    ];
  } catch (error) {
    console.error("Failed to fetch Helsinki councilors:", error);
    return [];
  }
}

