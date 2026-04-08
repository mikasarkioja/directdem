import type { SupabaseClient } from "@supabase/supabase-js";
import type { VaskiExpertRow } from "@/lib/lobby/committee-experts-vaski";
import { heFromFinnishDocId } from "@/lib/lobby/he-from-finnish-doc";

/**
 * Kirjaa valiokunnan asiantuntijakutsut lobbyist_interventions -tauluun
 * (source_type = expert_hearing). Vaatii legislative_project_id + source_external_id -UNIQUE.
 */
export async function upsertExpertHearingInterventions(
  admin: SupabaseClient,
  rows: VaskiExpertRow[],
  lpIdByHe: Map<string, string>,
  billByLpId: Map<string, string | null>,
): Promise<{ upserted: number; skippedNoLp: number; errors: string[] }> {
  const errors: string[] = [];
  let upserted = 0;
  let skippedNoLp = 0;

  const payloads: Record<string, unknown>[] = [];

  for (const r of rows) {
    const heKey = heFromFinnishDocId(r.eduskuntaTunnus);
    const lpId = heKey ? lpIdByHe.get(heKey) : null;
    if (!lpId) {
      skippedNoLp++;
      continue;
    }

    const org =
      (r.expertOrganization || r.expertName || "Asiantuntija")
        .trim()
        .slice(0, 500) || "Asiantuntija";

    const titlePlain = (r.titlePlain || "").trim();
    const summaryLine = [
      titlePlain,
      r.expertName ? `Asiantuntija: ${r.expertName}` : "",
      r.committeeCode ? `Valiokunta: ${r.committeeCode}` : "",
    ]
      .filter(Boolean)
      .join(" — ")
      .slice(0, 2000);

    const sourceUrl =
      r.pdfUrl?.trim() ||
      `https://avoindata.eduskunta.fi/vaski/vaski-id/${encodeURIComponent(r.vaskiRowId)}`;

    payloads.push({
      legislative_project_id: lpId,
      bill_id: billByLpId.get(lpId) ?? null,
      organization_name: org,
      category: r.committeeCode || "Valiokunta",
      summary_json: {
        plainLanguageSummary: summaryLine || titlePlain,
        source: "vaski_expert_hearing",
        expertName: r.expertName,
        titlePlain: r.titlePlain,
        committeeCode: r.committeeCode,
        sessionDateRaw: r.sessionDateRaw,
        vaskiRowId: r.vaskiRowId,
      },
      sentiment_score: null,
      source_url: sourceUrl,
      source_type: "expert_hearing",
      source_external_id: r.vaskiRowId,
      dedupe_key: `vaski_expert:${r.vaskiRowId}`,
      raw_excerpt: titlePlain.slice(0, 2000) || org.slice(0, 2000),
      analysis_model: null,
    });
  }

  const chunk = 50;
  for (let i = 0; i < payloads.length; i += chunk) {
    const slice = payloads.slice(i, i + chunk);
    const { error } = await admin.from("lobbyist_interventions").upsert(slice, {
      onConflict: "dedupe_key",
    });
    if (error) {
      errors.push(error.message);
      console.error("[upsertExpertHearingInterventions]", error.message);
    } else {
      upserted += slice.length;
    }
  }

  return { upserted, skippedNoLp, errors };
}
