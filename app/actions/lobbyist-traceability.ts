"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { checkAdminAccess } from "@/app/actions/admin";
import { collectLobbySourceDocuments } from "@/lib/lobby/collect-sources";
import { summarizeLobbyDocument } from "@/lib/lobby/llm-stance";
import type { LobbyInterventionRow } from "@/lib/lobby/types";

const ANALYSIS_MODEL = "gpt-4o-mini";

/**
 * projectId: joko public.bills.id (UUID) tai public.legislative_projects.id (UUID).
 * Synkronoi lausunnot + avoimuuslähteet ja kirjoittaa lobbyist_interventions -rivit.
 */
export async function fetchAndAnalyzeLobbyists(projectId: string): Promise<{
  success: boolean;
  error?: string;
  inserted?: number;
  legislativeProjectId?: string;
  heTunnus?: string;
}> {
  const isAdmin = await checkAdminAccess();
  if (!isAdmin) {
    return { success: false, error: "Vain ylläpidon sallittu." };
  }

  if (!projectId?.trim()) {
    return { success: false, error: "projectId puuttuu." };
  }

  const admin = await createAdminClient();

  const resolved = await resolveLegislativeProject(admin, projectId.trim());
  if (!resolved) {
    return {
      success: false,
      error: "Lainsäädäntökohdetta ei löytynyt (bills / legislative_projects).",
    };
  }

  const { legislativeProjectId, heTunnus } = resolved;

  const sources = await collectLobbySourceDocuments(heTunnus);
  if (!sources.length) {
    return {
      success: true,
      inserted: 0,
      legislativeProjectId,
      heTunnus,
      error:
        "Ei löydettyjä lähteitä. Käytä kehityksessä LOBBY_TRACE_USE_MOCK=true tai varmista rajapinnat.",
    };
  }

  await admin
    .from("lobbyist_interventions")
    .delete()
    .eq("legislative_project_id", legislativeProjectId)
    .in("source_type", ["lausunto", "avoimuus"]);

  let inserted = 0;
  for (const doc of sources) {
    try {
      const summary = await summarizeLobbyDocument(heTunnus, doc);
      const { error } = await admin.from("lobbyist_interventions").insert({
        legislative_project_id: legislativeProjectId,
        organization_name: summary.organizationName,
        category: summary.organizationCategory,
        summary_json: {
          organizationName: summary.organizationName,
          organizationCategory: summary.organizationCategory,
          coreStance: summary.coreStance,
          keyArguments: summary.keyArguments,
          proposedChanges: summary.proposedChanges,
          plainLanguageSummary: summary.plainLanguageSummary,
          sentimentScore: summary.sentimentScore,
        },
        sentiment_score: summary.sentimentScore,
        source_url: doc.sourceUrl,
        source_type: doc.sourceType,
        raw_excerpt: doc.textContent.slice(0, 2000),
        analysis_model: ANALYSIS_MODEL,
      });
      if (!error) inserted += 1;
      else console.error("[lobbyist-traceability] insert error", error.message);
    } catch (e) {
      console.warn("[lobbyist-traceability] doc skipped", doc.sourceUrl, e);
    }
  }

  return {
    success: true,
    inserted,
    legislativeProjectId,
    heTunnus,
  };
}

export async function getLobbyistInterventionsForBill(
  billId: string,
): Promise<LobbyInterventionRow[]> {
  try {
    const supabase = await createClient();
    const { data: bill, error: billErr } = await supabase
      .from("bills")
      .select("parliament_id")
      .eq("id", billId)
      .maybeSingle();

    if (billErr) {
      console.warn("[getLobbyistInterventionsForBill] bill:", billErr.message);
      return [];
    }

    const he = bill?.parliament_id?.trim();
    let lp: { id: string } | null = null;
    if (he) {
      const { data: lpRow, error: lpErr } = await supabase
        .from("legislative_projects")
        .select("id")
        .eq("he_tunnus", he)
        .maybeSingle();
      if (lpErr && !/does not exist|Could not find/i.test(lpErr.message)) {
        console.warn("[getLobbyistInterventionsForBill] lp:", lpErr.message);
      }
      lp = lpRow;
    }

    const { data: byProject, error: errProject } = lp?.id
      ? await supabase
          .from("lobbyist_interventions")
          .select("*")
          .eq("legislative_project_id", lp.id)
          .order("created_at", { ascending: false })
      : { data: [], error: null };

    const { data: byBill, error: errBill } = await supabase
      .from("lobbyist_interventions")
      .select("*")
      .eq("bill_id", billId)
      .order("created_at", { ascending: false });

    if (
      errProject &&
      !/does not exist|Could not find/i.test(errProject.message)
    ) {
      console.warn(
        "[getLobbyistInterventionsForBill] by project:",
        errProject.message,
      );
    }
    if (errBill && !/does not exist|Could not find/i.test(errBill.message)) {
      console.warn(
        "[getLobbyistInterventionsForBill] by bill:",
        errBill.message,
      );
    }

    const map = new Map<string, LobbyInterventionRow>();
    for (const r of (byProject ?? []) as LobbyInterventionRow[]) {
      map.set(r.id, r);
    }
    for (const r of (byBill ?? []) as LobbyInterventionRow[]) {
      map.set(r.id, r);
    }
    return Array.from(map.values()).sort(
      (a, b) =>
        Number(b.sentiment_score ?? -999) - Number(a.sentiment_score ?? -999),
    );
  } catch {
    return [];
  }
}

export async function getLobbyTraceabilityCapabilities(): Promise<{
  canSync: boolean;
}> {
  return { canSync: await checkAdminAccess() };
}

async function resolveLegislativeProject(
  admin: SupabaseClient,
  projectId: string,
): Promise<{ legislativeProjectId: string; heTunnus: string } | null> {
  const { data: bill } = await admin
    .from("bills")
    .select("id, parliament_id, title")
    .eq("id", projectId)
    .maybeSingle();

  if (bill?.parliament_id) {
    const heTunnus = bill.parliament_id.trim();
    const { data: lp, error } = await admin
      .from("legislative_projects")
      .upsert(
        {
          he_tunnus: heTunnus,
          bill_id: bill.id,
          title: bill.title,
        },
        { onConflict: "he_tunnus" },
      )
      .select("id, he_tunnus")
      .maybeSingle();

    if (error || !lp) {
      console.error(
        "[lobbyist-traceability] upsert legislative_projects",
        error,
      );
      return null;
    }
    return { legislativeProjectId: lp.id, heTunnus: lp.he_tunnus };
  }

  const { data: lpRow } = await admin
    .from("legislative_projects")
    .select("id, he_tunnus")
    .eq("id", projectId)
    .maybeSingle();

  if (lpRow) {
    return {
      legislativeProjectId: lpRow.id,
      heTunnus: lpRow.he_tunnus.trim(),
    };
  }

  return null;
}
