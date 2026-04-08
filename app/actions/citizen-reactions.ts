"use server";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/app/actions/auth";
import {
  rowsToAggregate,
  type CitizenPulseAggregate,
  type ReactionType,
} from "@/lib/citizen-reactions/aggregate";

export async function submitCitizenReaction(input: {
  billId: string;
  mpId: number;
  reactionType: ReactionType;
  comment?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const user = await getUser();
  if (!user?.id) {
    return { ok: false, error: "Kirjaudu sisään antaaksesi palautetta." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("citizen_reactions").upsert(
    {
      user_id: user.id,
      bill_id: input.billId.trim(),
      mp_id: input.mpId,
      reaction_type: input.reactionType,
      comment: input.comment?.trim() || null,
    },
    { onConflict: "user_id,bill_id" },
  );

  if (error) {
    console.error("[submitCitizenReaction]", error);
    return { ok: false, error: "Tallennus epäonnistui." };
  }

  return { ok: true };
}

export async function getBillReactionStats(
  billId: string,
): Promise<CitizenPulseAggregate> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("citizen_reactions")
    .select("reaction_type")
    .eq("bill_id", billId.trim());

  if (error || !data) {
    return { support: 0, oppose: 0, neutral: 0, total: 0, forPercent: null };
  }

  return rowsToAggregate(data as { reaction_type: string }[]);
}

export type ArenaCommentRow = {
  reaction_type: string;
  comment: string | null;
  created_at: string;
};

export async function getRecentArenaComments(
  billId: string,
  mpId: number,
  limit = 8,
): Promise<ArenaCommentRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("citizen_reactions")
    .select("reaction_type, comment, created_at")
    .eq("bill_id", billId.trim())
    .eq("mp_id", mpId)
    .not("comment", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.filter(
    (r) => (r.comment || "").trim().length > 0,
  ) as ArenaCommentRow[];
}
