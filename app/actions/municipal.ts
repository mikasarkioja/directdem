"use server";

import { createClient } from "@/lib/supabase/server";
import { getMunicipalAPI } from "@/lib/municipal-api";
import { generateMockCitizenPulse } from "@/lib/bill-helpers";
import type { MunicipalCase, SupabaseMunicipalCase } from "@/lib/types";

/**
 * Fetches municipal cases from Supabase or syncs from API if empty
 */
export async function fetchMunicipalCases(municipality: string = "Espoo"): Promise<MunicipalCase[]> {
  const supabase = await createClient();

  const { data: casesData, error } = await supabase
    .from("municipal_cases")
    .select("*")
    .eq("municipality", municipality)
    .order("meeting_date", { ascending: false })
    .limit(50);

  if (casesData && casesData.length > 0 && !error) {
    return casesData.map((c: SupabaseMunicipalCase) => ({
      id: c.id,
      municipality: c.municipality,
      externalId: c.external_id,
      title: c.title,
      summary: c.summary || "",
      rawText: c.raw_text || undefined,
      status: c.status as any,
      meetingDate: c.meeting_date || undefined,
      orgName: c.org_name || undefined,
      neighborhood: c.neighborhood || undefined,
      costEstimate: c.cost_estimate || undefined,
      category: c.category || undefined,
      url: c.url || undefined,
      citizenPulse: generateMockCitizenPulse({ title: c.title, abstract: c.summary || "" }),
    }));
  }

  // If no data, attempt sync
  try {
    console.log(`[fetchMunicipalCases] No data in DB, syncing from ${municipality} API...`);
    const api = getMunicipalAPI(municipality);
    const items = await api.fetchLatestItems(10);

    console.log(`[fetchMunicipalCases] Received ${items.length} items from API`);

    if (items.length > 0) {
      const casesToInsert = items.map(item => ({
        municipality: item.municipality,
        external_id: item.url || item.id, // RSS-linkkiä käytetään uniikkina tunnisteena
        title: item.title,
        summary: item.summary || item.title,
        raw_text: item.content || "",
        status: item.status || "agenda",
        meeting_date: item.meetingDate || new Date().toISOString(),
        org_name: item.orgName || "Kaupunginvaltuusto",
        url: item.url || ""
      }));

      console.log(`[fetchMunicipalCases] Upserting ${casesToInsert.length} cases to Supabase...`);
      const { data: inserted, error: insertError } = await supabase
        .from("municipal_cases")
        .upsert(casesToInsert, { 
          onConflict: "municipality,external_id",
          ignoreDuplicates: false 
        })
        .select();

      if (insertError) {
        console.error("[fetchMunicipalCases] Upsert error:", insertError);
        throw insertError;
      }

      console.log(`[fetchMunicipalCases] Successfully upserted ${inserted?.length || 0} cases`);

      if (inserted && inserted.length > 0) {
        return inserted.map((c: SupabaseMunicipalCase) => ({
          id: c.id,
          municipality: c.municipality,
          externalId: c.external_id,
          title: c.title,
          summary: c.summary || "",
          rawText: c.raw_text || undefined,
          status: c.status as any,
          meetingDate: c.meeting_date || undefined,
          orgName: c.org_name || undefined,
          neighborhood: c.neighborhood || undefined,
          costEstimate: c.cost_estimate || undefined,
          category: c.category || undefined,
          url: c.url || undefined,
          citizenPulse: generateMockCitizenPulse({ title: c.title, abstract: c.summary || "" }),
        }));
      }
    }
  } catch (syncError) {
    console.error(`[fetchMunicipalCases] Failed to sync municipal cases for ${municipality}:`, syncError);
  }

  return [];
}

/**
 * Fetches municipal decisions from the new modular table
 */
export async function fetchMunicipalDecisions(municipality: string = "Espoo"): Promise<any[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("municipal_decisions")
    .select("*")
    .eq("municipality", municipality)
    .order("decision_date", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error fetching decisions:", error);
    return [];
  }

  return data || [];
}

/**
 * Record a vote for a municipal case
 */
export async function voteOnMunicipalCase(
  caseId: string,
  position: "for" | "against" | "neutral",
  municipality: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Authentication required");

  // Check if user is resident of this municipality
  const { data: profile } = await supabase
    .from("profiles")
    .select("municipality")
    .eq("id", user.id)
    .single();

  const isResident = profile?.municipality?.toLowerCase() === municipality.toLowerCase();

  const { error } = await supabase
    .from("municipal_votes")
    .upsert({
      case_id: caseId,
      user_id: user.id,
      position,
      is_resident: isResident,
      updated_at: new Date().toISOString()
    }, { onConflict: "case_id,user_id" });

  if (error) throw error;
  return { success: true };
}
