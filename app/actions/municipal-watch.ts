"use server";

import { createClient } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";
import type { MunicipalDecision } from "@/lib/municipal/bridge";

export interface MunicipalWatchItem {
  id: string;
  municipality: string;
  meeting_title: string;
  meeting_date: string;
  ai_summary: {
    summary: string;
    dna_impact: Record<string, number>;
    mentioned_councilors: string[];
    attachment_notes?: string;
    pro_arguments?: string[];
    con_arguments?: string[];
    friction_index?: number;
  };
  external_url: string;
  flips?: Array<{
    axis: string;
    promise_score: number;
    action_impact: number;
    discrepancy: number;
    description: string;
    councilor_name: string;
    councilor_party: string;
  }>;
}

export async function fetchMunicipalWatchFeed(limit = 60) {
  return unstable_cache(
    async () => {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("meeting_analysis")
        .select(`
          id,
          municipality,
          meeting_title,
          meeting_date,
          ai_summary,
          external_url,
          local_flips (
            axis,
            promise_score,
            action_impact,
            discrepancy,
            description,
            councilors (
              full_name,
              party
            )
          )
        `)
        .order("meeting_date", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching municipal watch feed:", error);
        return [];
      }

      return (data || []).map((item: any) => ({
        id: item.id,
        municipality: item.municipality,
        meeting_title: item.meeting_title,
        meeting_date: item.meeting_date,
        ai_summary: item.ai_summary,
        external_url: item.external_url,
        flips: item.local_flips?.map((f: any) => ({
          axis: f.axis,
          promise_score: f.promise_score,
          action_impact: f.action_impact,
          discrepancy: f.discrepancy,
          description: f.description,
          councilor_name: f.councilors?.full_name,
          councilor_party: f.councilors?.party
        }))
      })) as MunicipalWatchItem[];
    },
    [`municipal-watch-feed-${limit}`],
    { revalidate: 900, tags: ["municipal-watch"] }
  )();
}

