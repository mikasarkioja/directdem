import type { SupabaseClient } from "@supabase/supabase-js";

/** Normalisoi bills.parliament_id → "HE 123/2025" -muotoon jos mahdollista. */
export function heTunnusFromParliamentId(
  raw: string | null | undefined,
): string | null {
  if (!raw?.trim()) return null;
  const s = raw.trim();
  const mFull = s.match(/\bHE\s*(\d+)\s*\/\s*(\d{4})\b/i);
  if (mFull) {
    return `HE ${mFull[1]}/${mFull[2]}`;
  }
  const mShort = s.match(/^(\d+)\s*\/\s*(\d{4})$/);
  if (mShort) {
    return `HE ${mShort[1]}/${mShort[2]}`;
  }
  return null;
}

/**
 * Täyttää legislative_projects riveistä, jotka jo löytyvät bills-taulusta
 * (process-bills ei ole aiemmin luonut legislative_projects-rivejä automaattisesti).
 */
export async function syncLegislativeProjectsFromBills(
  admin: SupabaseClient,
  options?: { maxRows?: number },
): Promise<{ upserted: number; skipped: number; error?: string }> {
  const maxRows = options?.maxRows ?? 2000;
  const { data: bills, error: qErr } = await admin
    .from("bills")
    .select("id, parliament_id, title")
    .not("parliament_id", "is", null)
    .limit(maxRows);

  if (qErr) {
    return { upserted: 0, skipped: 0, error: qErr.message };
  }

  const payload: {
    he_tunnus: string;
    bill_id: string;
    title: string | null;
  }[] = [];

  let skipped = 0;
  for (const b of bills ?? []) {
    const he = heTunnusFromParliamentId(b.parliament_id);
    if (!he) {
      skipped++;
      continue;
    }
    payload.push({
      he_tunnus: he,
      bill_id: b.id as string,
      title: b.title ?? null,
    });
  }

  let upserted = 0;
  const chunkSize = 100;
  for (let i = 0; i < payload.length; i += chunkSize) {
    const chunk = payload.slice(i, i + chunkSize);
    const { error } = await admin
      .from("legislative_projects")
      .upsert(chunk, { onConflict: "he_tunnus" });
    if (error) {
      console.warn("[syncLegislativeProjectsFromBills] chunk", error.message);
      skipped += chunk.length;
    } else {
      upserted += chunk.length;
    }
  }

  return { upserted, skipped };
}

/**
 * Yksi bills-rivi → legislative_projects (kutsutaan process-bills -ajosta).
 */
export async function upsertLegislativeProjectForBill(
  admin: SupabaseClient,
  billId: string,
  parliamentId: string | null | undefined,
  title: string | null | undefined,
): Promise<{ ok: boolean; error?: string; heTunnus?: string | null }> {
  const he = heTunnusFromParliamentId(parliamentId);
  if (!he) {
    return {
      ok: false,
      error: `Ei HE-muotoa parliament_id: ${String(parliamentId).slice(0, 80)}`,
      heTunnus: null,
    };
  }
  const { error } = await admin.from("legislative_projects").upsert(
    {
      he_tunnus: he,
      bill_id: billId,
      title: title ?? null,
    },
    { onConflict: "he_tunnus" },
  );
  if (error) {
    console.error(
      "[upsertLegislativeProjectForBill] legislative_projects upsert:",
      error.message,
    );
    return { ok: false, error: error.message, heTunnus: he };
  }
  return { ok: true, heTunnus: he };
}
