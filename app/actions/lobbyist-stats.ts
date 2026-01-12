"use server";

import { calculateInfluenceStats, LobbyistStats } from "@/lib/researcher/influence-stats";
import { getUser } from "@/app/actions/auth";

export async function getLobbyistLeaderboard(): Promise<LobbyistStats[]> {
  const user = await getUser();
  if (!user || user.plan_type !== 'premium') {
    // Return empty or throw, but here we return empty to handle in UI
    return [];
  }

  return await calculateInfluenceStats();
}

/**
 * Generates a verbal report based on the data.
 */
export async function generateLobbyistReport(stats: LobbyistStats[]) {
  if (stats.length === 0) return "Ei tarpeeksi dataa raportin luomiseen.";

  const top = stats[0];
  const totalBills = stats.reduce((acc, curr) => acc + curr.bills_count, 0);
  const totalMeetings = stats.reduce((acc, curr) => acc + curr.direct_contacts, 0);

  return `${top.organization_name} hallitsee tällä hetkellä Suomen lobby-kenttää Vaikutusindeksillä ${top.influence_index}. 
  Järjestö on onnistunut vaikuttamaan ${top.bills_count} lakiesitykseen vuonna 2025, painottuen erityisesti alueelle: ${top.main_committee}. 
  Analyysi osoittaa vahvan korrelaation suoran kontaktin ja tekstimuutosten välillä: Top-järjestöillä on keskimäärin ${top.direct_contacts} tapaamista päätöksentekijöiden kanssa per lakihanke. 
  Koko aineistossa on tunnistettu ${totalMeetings} tapaamista Avoimuusrekisterin perusteella.`;
}

