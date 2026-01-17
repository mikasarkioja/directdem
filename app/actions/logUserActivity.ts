"use server";

import { createClient } from "@/lib/supabase/server";
import { awardXP, ActionType } from "@/lib/influence/xp-engine";
import { revalidatePath } from "next/cache";

export async function logUserActivity(actionType: ActionType, metadata: any = {}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const result = await awardXP(user.id, actionType, metadata);
    
    // Refresh dashboard to show new stats
    revalidatePath("/dashboard");

    return { 
      success: true, 
      ...result 
    };
  } catch (error) {
    console.error("Failed to log activity:", error);
    return { success: false, error: "Database error" };
  }
}


