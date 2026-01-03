/**
 * Eduskunta Scraper & MP Profiler
 * Handles mass data extraction and political DNA analysis
 */

import { createClient } from "@/lib/supabase/server";

export interface MPProfile {
  parliamentId: number;
  fullName: string;
  party: string;
  dna: {
    economy: number;
    values: number;
    environment: number;
  };
}

// Categorization keywords
const CATEGORIES = {
  economy: ["verotus", "budjetti", "talous", "yritys", "työllisyys", "palkka"],
  values: ["uskonto", "perhe", "oikeus", "maahanmuutto", "tasa-arvo", "perusoikeus"],
  environment: ["luonto", "ilmasto", "metsä", "energia", "ympäristö", "hiilineutraali"]
};

/**
 * Fetches and analyzes MP votes to build political DNA
 * Note: This is a heavy operation, should be run as a background task.
 */
export async function scrapeAndProfileMPs(limit: number = 200) {
  console.log(`[MP-Profiler] Starting analysis for ${limit} MPs...`);
  
  // 1. Fetch MPs from Eduskunta API (simulated)
  // In a real app, we'd fetch from https://avoindata.eduskunta.fi/api/v1/data/Henkilo
  const mps = await fetchMPs();

  // 2. For each MP, analyze their voting history
  const profiles: MPProfile[] = [];
  
  for (const mp of mps.slice(0, limit)) {
    // Simulate rate limiting
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const analysis = await analyzeMPVoting(mp.id);
    profiles.push({
      parliamentId: mp.id,
      fullName: mp.name,
      party: mp.party,
      dna: analysis
    });
  }

  // 3. Save to Supabase
  const supabase = await createClient();
  for (const p of profiles) {
    await supabase.from("mp_profiles").upsert({
      parliament_id: p.parliamentId,
      full_name: p.fullName,
      party: p.party,
      dna_economy: p.dna.economy,
      dna_values: p.dna.values,
      dna_environment: p.dna.environment,
      last_analyzed_at: new Date().toISOString()
    }, { onConflict: "parliament_id" });
  }

  return profiles;
}

async function analyzeMPVoting(mpId: number) {
  // Mock analysis logic: 
  // In reality, we'd fetch all votes for this MP, link them to bill categories,
  // and see if they voted 'for' or 'against' relative to the axis (e.g. against tax increase = +market)
  
  // Generating deterministic mock DNA based on ID for demo purposes
  const seed = mpId / 1000;
  return {
    economy: Math.sin(seed * 7) * 0.8,
    values: Math.cos(seed * 5) * 0.7,
    environment: Math.sin(seed * 3) * 0.9
  };
}

async function fetchMPs() {
  // Simplified list of major Finnish MPs for demo
  return [
    { id: 1141, name: "Petteri Orpo", party: "Kokoomus" },
    { id: 1393, name: "Sanna Marin", party: "SDP" },
    { id: 1101, name: "Riikka Purra", party: "PS" },
    { id: 1281, name: "Li Andersson", party: "Vasemmisto" },
    { id: 1150, name: "Antti Kaikkonen", party: "Keskusta" },
    { id: 1411, name: "Maria Ohisalo", party: "Vihreät" },
    { id: 911, name: "Hjallis Harkimo", party: "Liike Nyt" }
  ];
}

/**
 * Finds the MP closest to a given DNA profile using Euclidean distance
 */
export async function findBestMatch(tribeDna: { economy: number, values: number, environment: number }) {
  const supabase = await createClient();
  const { data: profiles } = await supabase.from("mp_profiles").select("*");

  if (!profiles) return null;

  return profiles.map(p => {
    const distance = Math.sqrt(
      Math.pow(p.dna_economy - tribeDna.economy, 2) +
      Math.pow(p.dna_values - tribeDna.values, 2) +
      Math.pow(p.dna_environment - tribeDna.environment, 2)
    );
    
    // Convert distance to compatibility percentage (0-100%)
    // Max distance in 3D unit cube (-1 to 1) is sqrt(2^2 + 2^2 + 2^2) = sqrt(12) approx 3.46
    const maxDist = 3.46;
    const compatibility = Math.max(0, 100 * (1 - (distance / maxDist)));

    return {
      name: p.full_name,
      party: p.party,
      compatibility: Math.round(compatibility),
      dna: {
        x: p.dna_economy,
        y: p.dna_values
      }
    };
  }).sort((a, b) => b.compatibility - a.compatibility);
}

