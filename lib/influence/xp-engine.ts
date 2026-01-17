import { createClient } from "@/lib/supabase/server";
import { PoliticalVector } from "@/lib/ai/tagger";
import { calculateFeedRelevance } from "@/lib/feed/relevance";

export type ActionType = 'VOTE' | 'READ_LOCAL' | 'ARENA_DUEL' | 'STATEMENT' | 'NEWS_INTERACTION';

const BASE_XP: Record<ActionType, number> = {
  VOTE: 50,
  READ_LOCAL: 20,
  ARENA_DUEL: 100,
  STATEMENT: 75,
  NEWS_INTERACTION: 10
};

/**
 * Calculates Level based on total XP
 * Level = floor(sqrt(total_xp / 100)) + 1
 */
export function calculateLevel(totalXp: number): number {
  return Math.floor(Math.sqrt(totalXp / 100)) + 1;
}

/**
 * Calculates XP required for a specific level
 */
export function xpForLevel(level: number): number {
  return Math.pow(level - 1, 2) * 100;
}

export async function awardXP(userId: string, actionType: ActionType, metadata: any = {}) {
  const supabase = await createClient();

  // 1. Get user profile (including DNA and current XP)
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("xp, level, economic_score, liberal_conservative_score, environmental_score, urban_rural_score, international_national_score, security_score")
    .eq("id", userId)
    .single();

  if (!profile) return null;

  let xpToEarn = BASE_XP[actionType] || 0;

  // 2. Alignment Bonus (+50% if action vector aligns with DNA)
  if (metadata.political_vector) {
    const relevance = calculateFeedRelevance(profile, metadata.political_vector);
    if (relevance.score > 0.7) {
      xpToEarn = Math.round(xpToEarn * 1.5);
    }
  }

  const newTotalXp = (profile.xp || 0) + xpToEarn;
  const newLevel = calculateLevel(newTotalXp);
  const leveledUp = newLevel > (profile.level || 1);

  // 3. Update database
  const { error: updateError } = await supabase
    .from("user_profiles")
    .update({ 
      xp: newTotalXp, 
      level: newLevel,
      updated_at: new Date().toISOString()
    })
    .eq("id", userId);

  if (updateError) throw updateError;

  // 4. Log action
  await supabase.from("user_actions_log").insert({
    user_id: userId,
    action_type: actionType,
    xp_earned: xpToEarn,
    metadata
  });

  return {
    xpEarned: xpToEarn,
    totalXp: newTotalXp,
    level: newLevel,
    leveledUp
  };
}


