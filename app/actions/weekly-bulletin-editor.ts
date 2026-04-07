"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getUser } from "@/app/actions/auth";
import { fetchWeeklyBulletinEditorInput } from "@/lib/bulletin/editor-fetch";
import { synthesizeWeeklyBulletinWithGemini } from "@/lib/bulletin/editor-gemini";
import type { WeeklyBulletinEditorModel } from "@/lib/bulletin/editor-schema";

export type WeeklyBulletinPayload = WeeklyBulletinEditorModel & {
  groundingSources: { title: string; url: string }[];
  groundingUsed: boolean;
  periodStart: string;
  periodEnd: string;
};

export type GenerateWeeklyBulletinResult =
  | { ok: true; bulletin: WeeklyBulletinPayload }
  | { ok: false; error: string };

function toUtcRange(
  startDate: string,
  endDate: string,
): {
  startIso: string;
  endIso: string;
  labelFi: string;
} {
  const s = new Date(`${startDate}T00:00:00.000Z`);
  const e = new Date(`${endDate}T23:59:59.999Z`);
  if (!Number.isFinite(s.getTime()) || !Number.isFinite(e.getTime())) {
    throw new Error("Virheellinen päivämäärä.");
  }
  const labelFi = `${s.toLocaleDateString("fi-FI")} – ${e.toLocaleDateString("fi-FI")}`;
  return { startIso: s.toISOString(), endIso: e.toISOString(), labelFi };
}

/**
 * Viikkobulletiinin “päätoimittaja”-kerros: hakee päätökset, mediaosuudet, lobby-rivit ja Espoon kunnalliset,
 * syöttää ne Gemini 3 Flashille (Google Search Grounding) ja palauttaa rakenteen UI:lle.
 */
export async function generateWeeklyBulletin(
  startDate: string,
  endDate: string,
): Promise<GenerateWeeklyBulletinResult> {
  const profile = await getUser();
  if (!profile) {
    return { ok: false, error: "Kirjaudu sisään generoidaksesi bulletiinin." };
  }

  try {
    const { startIso, endIso, labelFi } = toUtcRange(
      startDate.trim(),
      endDate.trim(),
    );
    const admin = await createAdminClient();
    const input = await fetchWeeklyBulletinEditorInput(admin, startIso, endIso);
    const { model, groundingSources, groundingUsed } =
      await synthesizeWeeklyBulletinWithGemini(input, labelFi);

    const bulletin: WeeklyBulletinPayload = {
      ...model,
      groundingSources,
      groundingUsed,
      periodStart: startIso,
      periodEnd: endIso,
    };

    return { ok: true, bulletin };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Generointi epäonnistui.";
    console.error("[generateWeeklyBulletin]", e);
    return { ok: false, error: msg };
  }
}
