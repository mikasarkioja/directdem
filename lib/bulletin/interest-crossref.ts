import { organizationsLikelyMatch } from "@/lib/lobby/org-normalize";

/** Pienin liitos editor-fetchin lobby-riveihin (vältetään kierretty importti). */
type LobbyBriefLike = {
  organization_name: string;
  he_tunnus: string | null;
  source_url: string | null;
  project_title: string | null;
};

export type PersonInterestRow = {
  id: string;
  subject_type: "mp" | "councilor";
  mp_id: number | null;
  council_municipality: string | null;
  person_display_name: string;
  interest_organization: string;
  interest_organization_normalized: string;
  declaration_url: string;
};

export type BulletinInterestConflictHint = {
  kind: "mahdollinen_eturistiriita";
  heTunnus: string | null;
  billLabel: string | null;
  personLabel: string;
  subjectType: "mp" | "councilor";
  matchedInterestOrganization: string;
  lobbyOrganization: string;
  interventionSourceUrl: string | null;
  note: string;
};

export type MpLookup = {
  id: number;
  first_name: string | null;
  last_name: string | null;
};

function mpFullName(m: MpLookup): string {
  return [m.first_name, m.last_name].filter(Boolean).join(" ").trim();
}

/**
 * Ristiriitatähystin: jos päätöksentekijällä (kansanedustaja / valtuutettu) on sidonnaisuus
 * organisaatioon, joka on myös lausunnon antaja samassa HE-kontekstissa → signaali.
 */
export function buildPotentialInterestConflicts(
  lobbyInterventions: LobbyBriefLike[],
  interests: PersonInterestRow[],
  mps: MpLookup[],
): BulletinInterestConflictHint[] {
  const mpMap = new Map(mps.map((m) => [m.id, m]));
  const byHe = new Map<string, LobbyBriefLike[]>();

  for (const row of lobbyInterventions) {
    const he = row.he_tunnus?.trim();
    if (!he) continue;
    const list = byHe.get(he) ?? [];
    list.push(row);
    byHe.set(he, list);
  }

  const hints: BulletinInterestConflictHint[] = [];

  for (const [he, intrs] of byHe) {
    for (const intr of intrs) {
      for (const pi of interests) {
        const orgMatch = organizationsLikelyMatch(
          pi.interest_organization,
          intr.organization_name,
        );
        if (!orgMatch) continue;

        if (pi.subject_type === "mp" && pi.mp_id != null) {
          const mp = mpMap.get(pi.mp_id);
          const personLabel = mp ? mpFullName(mp) : pi.person_display_name;
          hints.push({
            kind: "mahdollinen_eturistiriita",
            heTunnus: he,
            billLabel: intr.project_title ?? he,
            personLabel,
            subjectType: "mp",
            matchedInterestOrganization: pi.interest_organization,
            lobbyOrganization: intr.organization_name,
            interventionSourceUrl: intr.source_url,
            note: "Mahdollinen eturistiriita: sidonnaisuusrekisterin organisaatio vastaa lausunnon antajaa. Ei vahvista väärinkäytöstä.",
          });
        }

        if (pi.subject_type === "councilor") {
          hints.push({
            kind: "mahdollinen_eturistiriita",
            heTunnus: he,
            billLabel: intr.project_title ?? he,
            personLabel: pi.person_display_name,
            subjectType: "councilor",
            matchedInterestOrganization: pi.interest_organization,
            lobbyOrganization: intr.organization_name,
            interventionSourceUrl: intr.source_url,
            note: "Mahdollinen eturistiriita (kunnallinen sidonnaisuus vs. valtakunnallinen lausunto). Varovainen signaali.",
          });
        }
      }
    }
  }

  const seen = new Set<string>();
  return hints.filter((h) => {
    const k = [
      h.heTunnus,
      h.personLabel,
      h.matchedInterestOrganization,
      h.lobbyOrganization,
    ].join("|");
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
