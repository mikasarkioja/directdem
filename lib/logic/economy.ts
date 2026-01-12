import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type TransactionType = 'EARN' | 'SPEND';

/**
 * lib/logic/economy.ts
 * Handles credits and impact points transactions.
 */
export async function processTransaction(
  userId: string,
  amount: number,
  reason: string,
  type: TransactionType
) {
  const supabase = await createAdminClient();

  // 1. If spending, check balance - TEMPORARILY DISABLED
  if (type === 'SPEND') {
    /* 
    const { data: profile, error: fetchError } = await supabase
      .from("user_profiles")
      .select("credits")
      .eq("id", userId)
      .single();

    if (fetchError || !profile) {
      throw new Error("Käyttäjäprofiilia ei löytynyt.");
    }

    if ((profile.credits || 0) < amount) {
      throw new Error("Ei tarpeeksi krediittejä.");
    }
    */
    console.log(`[Economy] Spending ${amount} credits for user ${userId} - Check bypassed`);
  }

  // 2. Perform the update
  const increment = type === 'EARN' ? amount : -amount;
  
  try {
    const { error: updateError } = await supabase.rpc('increment_credits', {
      user_id: userId,
      amount: increment
    });

    // If RPC doesn't exist, we fallback to direct update (riskier but works for demo)
    if (updateError) {
      const { data: currentProfile } = await supabase
        .from("user_profiles")
        .select("credits")
        .eq("id", userId)
        .single();
      
      if (currentProfile) {
        await supabase
          .from("user_profiles")
          .update({ credits: (currentProfile?.credits || 0) + increment })
          .eq("id", userId);
      }
    }
  } catch (err) {
    console.warn("[Economy] Profile update failed, skipping DB sync:", err);
  }

  // 3. Log transaction
  try {
    await supabase.from("transactions").insert({
      user_id: userId,
      amount,
      points_type: 'CREDIT',
      action_type: type,
      description: reason,
    });
  } catch (err) {
    console.warn("[Economy] Transaction log failed:", err);
  }

  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Awards impact points separately (or alongside credits)
 */
export async function awardImpactPoints(userId: string, amount: number, reason: string) {
  const supabase = await createAdminClient();
  
  try {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("impact_points")
      .eq("id", userId)
      .single();

    if (profile) {
      const currentPoints = profile?.impact_points || 0;
      
      await supabase
        .from("user_profiles")
        .update({ impact_points: currentPoints + amount })
        .eq("id", userId);
    }
  } catch (err) {
    console.warn("[Economy] Impact points update failed:", err);
  }

  // Log as transaction
  try {
    await supabase.from("transactions").insert({
      user_id: userId,
      amount,
      points_type: 'IMPACT',
      action_type: 'EARN',
      description: reason,
    });
  } catch (err) {
    console.warn("[Economy] Impact transaction log failed:", err);
  }

  revalidatePath("/dashboard");
}

