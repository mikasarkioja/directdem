import { createAdminClient } from "@/lib/supabase/server";

// GPT-4o Prices (Approx USD per 1M tokens)
const GPT4O_INPUT_PRICE = 2.5 / 1_000_000;
const GPT4O_OUTPUT_PRICE = 10.0 / 1_000_000;

/**
 * lib/analytics/tracker.ts
 * Internal tracking for features and AI costs.
 */

export async function trackFeatureUsage(
  featureName: string,
  actionType: string,
  userId?: string
) {
  try {
    const supabase = await createAdminClient();
    await supabase.from("feature_usage_logs").insert({
      user_id: userId,
      feature_name: featureName,
      action_type: actionType,
    });
  } catch (err) {
    console.error("Failed to track feature usage:", err);
  }
}

export async function logAiCost(
  featureContext: string,
  model: string,
  inputTokens: number,
  outputTokens: number,
  userId?: string
) {
  try {
    const cost = (inputTokens * GPT4O_INPUT_PRICE) + (outputTokens * GPT4O_OUTPUT_PRICE);
    
    const supabase = await createAdminClient();
    await supabase.from("ai_usage_logs").insert({
      user_id: userId,
      feature_context: featureContext,
      model_name: model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_usd: cost,
    });
    
    return cost;
  } catch (err) {
    console.error("Failed to log AI cost:", err);
    return 0;
  }
}

