"use server";

import { createClient } from "@/lib/supabase/server";

export interface VoteStats {
  for_count: number;
  against_count: number;
  neutral_count: number;
  total_count: number;
  for_percent: number;
  against_percent: number;
  neutral_percent: number;
}

export async function submitVote(billId: string, position: "for" | "against" | "neutral") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Sinun täytyy olla kirjautunut äänestääksesi");
  }

  // Upsert vote (insert or update)
  const { error } = await supabase
    .from("votes")
    .upsert(
      {
        bill_id: billId,
        user_id: user.id,
        position,
      },
      {
        onConflict: "bill_id,user_id",
      }
    );

  if (error) {
    throw new Error(`Äänestys epäonnistui: ${error.message}`);
  }

  return { success: true };
}

export async function getUserVote(billId: string): Promise<"for" | "against" | "neutral" | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("votes")
    .select("position")
    .eq("bill_id", billId)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return null;
  }

  return data.position as "for" | "against" | "neutral";
}

export async function getVoteStats(billId: string): Promise<VoteStats> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_vote_stats", {
    bill_uuid: billId,
  });

  if (error || !data || data.length === 0) {
    return {
      for_count: 0,
      against_count: 0,
      neutral_count: 0,
      total_count: 0,
      for_percent: 0,
      against_percent: 0,
      neutral_percent: 0,
    };
  }

  return data[0] as VoteStats;
}

