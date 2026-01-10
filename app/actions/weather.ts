// app/actions/weather.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { predictVoteOutcome } from "@/lib/analysis/weather-engine";
import { revalidatePath } from "next/cache";

export async function getBillForecast(billId: string) {
  try {
    return await predictVoteOutcome(billId);
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function placePrediction(billId: string, outcome: 'pass' | 'fail') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from('user_predictions')
    .upsert({
      user_id: user.id,
      bill_id: billId,
      prediction_type: 'outcome',
      predicted_value: outcome
    }, { onConflict: 'user_id,bill_id,prediction_type' });

  if (error) throw error;
  
  revalidatePath(`/ennusteet/${billId}`);
  return { success: true };
}

export async function getUserPrediction(billId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('user_predictions')
    .select('*')
    .eq('user_id', user.id)
    .eq('bill_id', billId)
    .eq('prediction_type', 'outcome')
    .single();

  return data;
}


