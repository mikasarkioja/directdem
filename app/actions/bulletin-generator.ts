"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getUser } from "@/app/actions/auth";
import { fetchWeeklyBulletinEditorInput } from "@/lib/bulletin/editor-fetch";
import { synthesizeEditorialBulletinWithGemini } from "@/lib/bulletin/editorial-gemini";
import type { EditorialBulletinModel } from "@/lib/bulletin/editorial-schema";

export type EditorialBulletinPayload = EditorialBulletinModel & {
  citationSources: { title: string; url: string }[];
  groundingSources: { title: string; url: string }[];
  groundingUsed: boolean;
  periodStart: string;
  periodEnd: string;
  lobbyTraceDemoMode: boolean;
};

export type GenerateEditorialBulletinResult =
  | { ok: true; bulletin: EditorialBulletinPayload }
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

function defaultLast7UtcRange(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 7);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

/**
 * Toimituksellinen viikkolehti: päätökset (eduskunta + Espoo), lobby + asiantuntijakutsut,
 * Gemini 3 Flash -narratiivi ja Google Grounding -lähteet.
 * `LOBBY_TRACE_USE_MOCK=true` = demo-tila (lausuntopalvelu/avoimuuskeräin käyttää mock-dataa);
 * tuotannossa näytetään varoitus vain UI:ssa — tämä action lukee edelleen `lobbyist_interventions` -taulun.
 */
export async function generateEditorialBulletin(
  startDate?: string,
  endDate?: string,
): Promise<GenerateEditorialBulletinResult> {
  const profile = await getUser();
  if (!profile) {
    return { ok: false, error: "Kirjaudu sisään generoidaksesi lehden." };
  }

  const range = defaultLast7UtcRange();
  const s = (startDate || range.startDate).trim();
  const e = (endDate || range.endDate).trim();

  try {
    const { startIso, endIso, labelFi } = toUtcRange(s, e);
    const admin = await createAdminClient();
    const input = await fetchWeeklyBulletinEditorInput(admin, startIso, endIso);
    const { model, citationSources, groundingSources, groundingUsed } =
      await synthesizeEditorialBulletinWithGemini(input, labelFi);

    const lobbyTraceDemoMode = process.env.LOBBY_TRACE_USE_MOCK === "true";

    const bulletin: EditorialBulletinPayload = {
      ...model,
      citationSources,
      groundingSources,
      groundingUsed,
      periodStart: startIso,
      periodEnd: endIso,
      lobbyTraceDemoMode,
    };

    return { ok: true, bulletin };
  } catch (e) {
    const msg =
      e instanceof Error
        ? e.message
        : "Toimituksellinen generointi epäonnistui.";
    console.error("[generateEditorialBulletin]", e);
    return { ok: false, error: msg };
  }
}
