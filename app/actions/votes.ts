"use server";

import { createClient } from "@/lib/supabase/server";
import type { VoteStats, VotePosition } from "@/lib/types";
import { addDNAPoints } from "./dna";

export async function submitVote(billId: string, position: VotePosition) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Sinun täytyy olla kirjautunut äänestääksesi");
  }

  // Get previous vote to check for mediator logic (changing stance)
  const { data: previousVote } = await supabase
    .from("votes")
    .select("position")
    .eq("bill_id", billId)
    .eq("user_id", user.id)
    .single();

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

  // --- DNA Points Logic ---
  
  // 1. Active: +1 for every vote
  await addDNAPoints("active", 1);

  // 2. Mediator: +2 for 'neutral' or changing stance
  if (position === "neutral" || (previousVote && previousVote.position !== position)) {
    await addDNAPoints("mediator", 2);
  }

  // 3. Reformer: +2 if vote deviates significantly from majority
  try {
    const stats = await getVoteStats(billId);
    if (stats.total_count > 5) { // Only check if there's enough data
      const majorityPosition = stats.for_percent > 60 ? "for" : stats.against_percent > 60 ? "against" : null;
      if (majorityPosition && position !== majorityPosition && position !== "neutral") {
        await addDNAPoints("reformer", 2);
      }
    }
  } catch (e) {
    console.warn("Could not calculate reformer points:", e);
  }

  return { success: true };
}

export async function getUserVote(billId: string): Promise<VotePosition | null> {
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

