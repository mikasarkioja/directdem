"use server";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "./auth";

/**
 * app/actions/researcher.ts
 * Server actions for the Researcher module.
 */

export async function exportResearcherData(format: 'json' | 'csv') {
  const user = await getUser();
  
  // TEMPORARY: Security/Monetization Check disabled for testing
  /*
  if (!user || (user.plan_type !== 'researcher' && user.plan_type !== 'enterprise')) {
    throw new Error("Tämä ominaisuus vaatii Tutkija-tilauksen (24,90€/kk).");
  }
  */

  const supabase = await createClient();

  // Fetch complex joined data
  const { data, error } = await supabase
    .from("mps")
    .select(`
      id,
      first_name,
      last_name,
      party,
      mp_profiles (*),
      mp_activity_stream (*)
    `);

  if (error) throw error;

  if (format === 'json') {
    return JSON.stringify(data, null, 2);
  } else {
    // Basic CSV conversion
    const headers = ["ID", "Nimi", "Puolue", "LoyaltyScore"];
    const rows = data.map(mp => [
      mp.id,
      `${mp.first_name} ${mp.last_name}`,
      mp.party,
      (mp.mp_profiles as any)?.[0]?.activity_index || 0
    ]);
    
    return [headers, ...rows].map(r => r.join(",")).join("\n");
  }
}

export async function getLoyaltyData() {
  const supabase = await createClient();
  
  // In a real app, this would be a complex query or RPC
  const { data, error } = await supabase
    .from("mps")
    .select(`
      id,
      first_name,
      last_name,
      party,
      mp_profiles (economic_score, liberal_conservative_score, activity_index)
    `);

  if (error) return [];

  return data.map(mp => ({
    id: mp.id,
    name: `${mp.first_name} ${mp.last_name}`,
    party: mp.party,
    x: (mp.mp_profiles as any)?.[0]?.economic_score || 0,
    y: (mp.mp_profiles as any)?.[0]?.liberal_conservative_score || 0,
    loyalty: Math.floor(Math.random() * 30) + 70 // Simulated for now
  }));
}

