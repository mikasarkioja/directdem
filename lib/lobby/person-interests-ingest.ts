/**
 * Sidonnaisuusilmoitukset (kansanedustajat, kunnanvaltuutetut).
 * Täytä `person_interests` vain virallisista julkisista lähteistä.
 *
 * MPs: ilmoitukset julkaistaan eduskunnan sivustolla (sidonnaisuusrekisteri).
 * Espoo: kunnan päätöksentekoon liittyvät sidonnaisuusilmoitukset kaupungin sivustolla.
 * Tarkat HTML-rakenteet vaihtelevat — ingestoi rivejä palvelukohtaisella skriptillä tai hallintatyökalulla.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeOrganization } from "@/lib/lobby/org-normalize";

export const OFFICIAL_INTEREST_SOURCE_LABELS = {
  eduskuntaFi: "https://www.eduskunta.fi/",
  espooFi: "https://www.espoo.fi/",
} as const;

export type PersonInterestInsert = {
  subject_type: "mp" | "councilor";
  mp_id?: number | null;
  council_municipality?: string | null;
  councilor_external_ref?: string | null;
  person_display_name: string;
  interest_organization: string;
  role_or_relation?: string | null;
  declaration_url: string;
  declaration_date?: string | null;
  source_register_label?: string | null;
  raw_excerpt?: string | null;
};

export function toPersonInterestRowPayload(row: PersonInterestInsert) {
  const norm = normalizeOrganization(row.interest_organization);
  return {
    subject_type: row.subject_type,
    mp_id: row.subject_type === "mp" ? (row.mp_id ?? null) : null,
    council_municipality:
      row.subject_type === "councilor"
        ? (row.council_municipality ?? null)
        : null,
    councilor_external_ref:
      row.subject_type === "councilor"
        ? (row.councilor_external_ref ?? null)
        : null,
    person_display_name: row.person_display_name.trim(),
    interest_organization: row.interest_organization.trim(),
    interest_organization_normalized: norm,
    role_or_relation: row.role_or_relation ?? null,
    declaration_url: row.declaration_url.trim(),
    declaration_date: row.declaration_date ?? null,
    source_register_label: row.source_register_label ?? null,
    raw_excerpt: row.raw_excerpt ?? null,
  };
}

export async function ingestPersonInterests(
  admin: SupabaseClient,
  rows: PersonInterestInsert[],
): Promise<{ inserted: number; error?: string }> {
  const payload = rows.map(toPersonInterestRowPayload);
  if (!payload.length) return { inserted: 0 };
  const res = await admin.from("person_interests").upsert(payload, {
    onConflict:
      "person_display_name,interest_organization_normalized,declaration_url",
  });
  if (res.error) return { inserted: 0, error: res.error.message };
  return { inserted: payload.length };
}
