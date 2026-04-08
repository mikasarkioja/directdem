export type LobbyGraphNode = {
  id: string;
  name: string;
  val: number;
  group: "mp" | "org" | "expert" | "bill";
};

export type LobbyGraphLink = {
  source: string;
  target: string;
  kind:
    | "avoimuustapaaminen"
    | "sidonnaisuus"
    | "lausunto"
    | "asiantuntijakuuleminen";
};

export type LobbyConnectionGraphPayload = {
  nodes: LobbyGraphNode[];
  links: LobbyGraphLink[];
  disclaimerFi: string;
};

/** Uniikit solmut ryhmittäin — sama data kuin graafissa, järjestys fi-localeCompare. */
export function groupLobbyGraphNodesByRole(nodes: LobbyGraphNode[]): {
  bills: LobbyGraphNode[];
  organizations: LobbyGraphNode[];
  specialists: LobbyGraphNode[];
} {
  const uniq = (group: LobbyGraphNode["group"]) => {
    const map = new Map<string, LobbyGraphNode>();
    for (const n of nodes) {
      if (n.group !== group) continue;
      if (!map.has(n.id)) map.set(n.id, n);
    }
    return [...map.values()].sort((a, b) =>
      a.name.localeCompare(b.name, "fi", { sensitivity: "base" }),
    );
  };
  return {
    bills: uniq("bill"),
    organizations: uniq("org"),
    specialists: uniq("expert"),
  };
}
