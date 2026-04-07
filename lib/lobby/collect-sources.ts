import type { LobbySourceDocument } from "@/lib/lobby/types";
import { fetchLausuntoSourcesForHe } from "@/lib/lobby/collectors/lausuntopalvelu";
import { fetchAvoimuusSourcesForHe } from "@/lib/lobby/collectors/avoimuusrekisteri";

export async function collectLobbySourceDocuments(
  heTunnus: string,
): Promise<LobbySourceDocument[]> {
  const [lausunnot, avoimuus] = await Promise.all([
    fetchLausuntoSourcesForHe(heTunnus),
    fetchAvoimuusSourcesForHe(heTunnus),
  ]);

  return [...lausunnot, ...avoimuus];
}
