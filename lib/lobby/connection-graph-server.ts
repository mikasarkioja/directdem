import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeOrganization } from "@/lib/lobby/org-normalize";
import type {
  LobbyGraphLink,
  LobbyGraphNode,
  LobbyConnectionGraphPayload,
} from "@/lib/lobby/connection-graph-model";

export type {
  LobbyGraphLink,
  LobbyGraphNode,
  LobbyConnectionGraphPayload,
} from "@/lib/lobby/connection-graph-model";
export { groupLobbyGraphNodesByRole } from "@/lib/lobby/connection-graph-model";

/**
 * Rakentaa näytettävän graafin julkisista / palveluun tallennetuista lähteistä.
 * Tulkinta: yhteydet ovat kuvaavia, eivät todisteita väärinkäytöksestä.
 */
export async function loadLobbyConnectionGraph(
  admin: SupabaseClient,
): Promise<LobbyConnectionGraphPayload> {
  const disclaimerFi =
    "Kaaviossa yhdistetään virallisia ja palvelussa seurattavia lähteitä. Yhteydet on tulkittava mahdollisina sidonnaisuuksina, ei vahvistettuna eturistiriitana tai korruptiona.";

  const nodes = new Map<string, LobbyGraphNode>();
  const links: LobbyGraphLink[] = [];

  const addNode = (n: LobbyGraphNode) => {
    if (!nodes.has(n.id)) nodes.set(n.id, n);
  };

  const meetings = await admin
    .from("lobbyist_meetings")
    .select("mp_id, organization_name")
    .order("meeting_date", { ascending: false })
    .limit(120);

  if (!meetings.error && meetings.data) {
    for (const row of meetings.data as {
      mp_id: number | null;
      organization_name: string;
    }[]) {
      if (!row.mp_id || !row.organization_name?.trim()) continue;
      const orgId = `org:${normalizeOrganization(row.organization_name)}`;
      addNode({
        id: `mp:${row.mp_id}`,
        name: `Kansanedustaja #${row.mp_id}`,
        val: 6,
        group: "mp",
      });
      addNode({
        id: orgId,
        name: row.organization_name,
        val: 4,
        group: "org",
      });
      links.push({
        source: `mp:${row.mp_id}`,
        target: orgId,
        kind: "avoimuustapaaminen",
      });
    }
  }

  const interests = await admin
    .from("person_interests")
    .select("mp_id, person_display_name, interest_organization, subject_type")
    .limit(200);

  if (!interests.error && interests.data) {
    for (const row of interests.data as {
      mp_id: number | null;
      person_display_name: string;
      interest_organization: string;
      subject_type: string;
    }[]) {
      const orgId = `org:${normalizeOrganization(row.interest_organization)}`;
      addNode({
        id: orgId,
        name: row.interest_organization,
        val: 4,
        group: "org",
      });
      if (row.subject_type === "mp" && row.mp_id) {
        addNode({
          id: `mp:${row.mp_id}`,
          name: row.person_display_name,
          val: 6,
          group: "mp",
        });
        links.push({
          source: `mp:${row.mp_id}`,
          target: orgId,
          kind: "sidonnaisuus",
        });
      }
    }
  }

  const experts = await admin
    .from("committee_expert_invites")
    .select("expert_name, expert_organization, he_tunnus, title_plain, pdf_url")
    .order("first_seen_at", { ascending: false })
    .limit(80);

  if (!experts.error && experts.data) {
    let i = 0;
    for (const row of experts.data as {
      expert_name: string | null;
      expert_organization: string | null;
      he_tunnus: string | null;
      title_plain: string;
      pdf_url: string | null;
    }[]) {
      const exName = row.expert_name?.trim() || `Asiantuntija (${++i})`;
      const exId = `expert:${row.pdf_url || row.title_plain.slice(0, 40) + i}`;
      addNode({ id: exId, name: exName, val: 3, group: "expert" });
      if (row.expert_organization?.trim()) {
        const orgId = `org:${normalizeOrganization(row.expert_organization)}`;
        addNode({
          id: orgId,
          name: row.expert_organization,
          val: 4,
          group: "org",
        });
        links.push({
          source: exId,
          target: orgId,
          kind: "asiantuntijakuuleminen",
        });
      }
      if (row.he_tunnus?.trim()) {
        const billId = `bill:${row.he_tunnus.trim()}`;
        addNode({
          id: billId,
          name: row.he_tunnus.trim(),
          val: 5,
          group: "bill",
        });
        links.push({
          source: exId,
          target: billId,
          kind: "asiantuntijakuuleminen",
        });
      }
    }
  }

  const lob = await admin
    .from("lobbyist_interventions")
    .select("id, organization_name, legislative_project_id")
    .order("created_at", { ascending: false })
    .limit(60);

  if (!lob.error && lob.data && lob.data.length) {
    const lpIds = [
      ...new Set(
        (lob.data as { legislative_project_id?: string }[])
          .map((r) => r.legislative_project_id?.trim())
          .filter((id): id is string => !!id),
      ),
    ];
    const lpMap = new Map<string, string | null>();
    if (lpIds.length) {
      const lpRes = await admin
        .from("legislative_projects")
        .select("id, he_tunnus")
        .in("id", lpIds);
      if (!lpRes.error && lpRes.data) {
        for (const r of lpRes.data as {
          id: string;
          he_tunnus: string | null;
        }[]) {
          lpMap.set(r.id, r.he_tunnus);
        }
      }
    }
    for (const row of lob.data as {
      organization_name: string;
      legislative_project_id?: string | null;
    }[]) {
      const orgId = `org:${normalizeOrganization(row.organization_name)}`;
      addNode({
        id: orgId,
        name: row.organization_name,
        val: 4,
        group: "org",
      });
      const he =
        row.legislative_project_id && lpMap.get(row.legislative_project_id);
      if (he?.trim()) {
        const billId = `bill:${he.trim()}`;
        addNode({ id: billId, name: he.trim(), val: 5, group: "bill" });
        links.push({
          source: orgId,
          target: billId,
          kind: "lausunto",
        });
      }
    }
  }

  const mpNodeIds = [...nodes.values()]
    .filter((n) => n.group === "mp")
    .map((n) => {
      const m = /^mp:(\d+)$/.exec(n.id);
      return m ? parseInt(m[1], 10) : NaN;
    })
    .filter((id) => Number.isFinite(id));

  if (mpNodeIds.length) {
    const uniq = [...new Set(mpNodeIds)];
    const mpsRes = await admin
      .from("mps")
      .select("id, first_name, last_name")
      .in("id", uniq);
    if (!mpsRes.error && mpsRes.data) {
      const nameById = new Map<number, string>();
      for (const r of mpsRes.data as {
        id: number;
        first_name: string | null;
        last_name: string | null;
      }[]) {
        nameById.set(
          r.id,
          [r.first_name, r.last_name].filter(Boolean).join(" ").trim() ||
            `Kansanedustaja ${r.id}`,
        );
      }
      for (const n of nodes.values()) {
        if (n.group !== "mp") continue;
        const m = /^mp:(\d+)$/.exec(n.id);
        if (!m) continue;
        const label = nameById.get(parseInt(m[1], 10));
        if (label) n.name = label;
      }
    }
  }

  return {
    nodes: [...nodes.values()],
    links,
    disclaimerFi,
  };
}
