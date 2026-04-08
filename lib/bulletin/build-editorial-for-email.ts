import { createAdminClient } from "@/lib/supabase/server";
import type { EditorialBulletinPayload } from "@/app/actions/bulletin-generator";
import { fetchWeeklyBulletinEditorInput } from "@/lib/bulletin/editor-fetch";
import { synthesizeEditorialBulletinWithGemini } from "@/lib/bulletin/editorial-gemini";

/**
 * Cron-safe editorial bulletin without `getUser()` — same data path as the dashboard action.
 */
export async function buildEditorialBulletinPayloadForEmail(
  startIso: string,
  endIso: string,
): Promise<EditorialBulletinPayload> {
  const admin = await createAdminClient();
  const s = new Date(startIso);
  const e = new Date(endIso);
  const labelFi = `${s.toLocaleDateString("fi-FI")} – ${e.toLocaleDateString("fi-FI")}`;

  const input = await fetchWeeklyBulletinEditorInput(admin, startIso, endIso);
  const { model, citationSources, groundingSources, groundingUsed } =
    await synthesizeEditorialBulletinWithGemini(input, labelFi);

  return {
    ...model,
    citationSources,
    groundingSources,
    groundingUsed,
    periodStart: startIso,
    periodEnd: endIso,
    lobbyTraceDemoMode: process.env.LOBBY_TRACE_USE_MOCK === "true",
  };
}
