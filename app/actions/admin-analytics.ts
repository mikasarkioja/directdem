"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { getUser } from "@/app/actions/auth";

export async function getAdminAnalytics() {
  const user = await getUser();

  // TEMPORARY: Disabled security check for testing
  /*
  if (!user || (!user.email?.includes('admin') && user.email !== 'nika.sarkioja@gmail.com')) {
    throw new Error("Unauthorized");
  }
  */

  const supabase = await createAdminClient();

  // 1. Total AI Spend (this month)
  const firstOfMonth = new Date();
  firstOfMonth.setDate(1);
  firstOfMonth.setHours(0, 0, 0, 0);

  const { data: aiLogs } = await supabase
    .from("ai_usage_logs")
    .select("cost_usd, created_at, feature_context")
    .gte("created_at", firstOfMonth.toISOString());

  const totalSpend = aiLogs?.reduce((acc, log) => acc + log.cost_usd, 0) || 0;

  // 2. Feature Usage Stats
  const { data: featureLogs } = await supabase
    .from("feature_usage_logs")
    .select("feature_name, created_at");

  // 3. Group AI cost by day for chart
  const dailyAiCost: Record<string, number> = {};
  aiLogs?.forEach((log) => {
    const day = new Date(log.created_at).toLocaleDateString("fi-FI");
    dailyAiCost[day] = (dailyAiCost[day] || 0) + log.cost_usd;
  });

  const aiCostChartData = Object.entries(dailyAiCost).map(([date, cost]) => ({
    date,
    cost: parseFloat(cost.toFixed(4)),
  }));

  // 4. Feature popularity for chart
  const featurePopularity: Record<string, number> = {};
  featureLogs?.forEach((log) => {
    featurePopularity[log.feature_name] =
      (featurePopularity[log.feature_name] || 0) + 1;
  });

  const featureChartData = Object.entries(featurePopularity).map(
    ([name, count]) => ({
      name,
      count,
    }),
  );

  // 5. Recent AI transactions
  const { data: recentAi } = await supabase
    .from("ai_usage_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  // 6. Tutkijatyöpöydän aineistoviennit (audit)
  const { data: researcherExportLogs, error: exportLogErr } = await supabase
    .from("researcher_export_logs")
    .select(
      "dataset_key, export_format, row_count, ai_insight_requested, created_at, user_id",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  const exportLogSummaries = researcherExportLogs || [];
  if (exportLogErr) {
    console.warn(
      "[getAdminAnalytics] researcher_export_logs:",
      exportLogErr.message,
    );
  }

  const researcherExportsByDataset: Record<string, number> = {};
  exportLogSummaries.forEach((row) => {
    const k = row.dataset_key || "unknown";
    researcherExportsByDataset[k] = (researcherExportsByDataset[k] || 0) + 1;
  });

  const researcherExportChartData = Object.entries(
    researcherExportsByDataset,
  ).map(([name, count]) => ({ name, count }));

  return {
    totalSpend: totalSpend.toFixed(2),
    aiCostChartData,
    featureChartData,
    recentAi: recentAi || [],
    researcherExportLogs: exportLogSummaries,
    researcherExportChartData,
  };
}
