"use server";

import { createClient } from "@/lib/supabase/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

/**
 * Fetches timeline data and generates an AI summary for a specific MP.
 */
export async function getDependencyTimelineData(mpId: string | number) {
  const supabase = await createClient();

  // 1. Fetch History
  const { data: history } = await supabase
    .from("mp_dependency_history")
    .select("*")
    .eq("mp_id", mpId)
    .order("detected_at", { ascending: false });

  // 2. Fetch Correlations
  const { data: correlations } = await supabase
    .from("mp_interest_correlations")
    .select("*")
    .eq("mp_id", mpId);

  // 3. Format into TimelineEvents
  // For demo, we mix simulated political events if real speeches aren't joined yet
  const events: any[] = (history || []).map(h => ({
    id: h.id,
    type: 'financial',
    date: h.detected_at,
    title: `${h.change_type}: ${h.organization}`,
    description: h.description,
    theme: h.category
  }));

  // Add correlation-linked political events
  (correlations || []).forEach(c => {
    events.push({
      id: c.id,
      type: 'political',
      date: c.created_at, // Use created_at as proxy for speech date if not linked
      title: `Poliittinen aktiivisuus: ${c.theme}`,
      description: c.correlation_reasoning,
      theme: c.theme,
      correlation: {
        score: c.significance_score,
        reasoning: c.correlation_reasoning
      }
    });
  });

  // Sort by date
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // 4. Generate AI Summary
  const { text: summary } = await generateText({
    model: openai("gpt-4o") as any,
    system: "Olet poliittinen tutkija.",
    prompt: `Tiivistä seuraava data lyhyeksi tutkijan raportiksi (max 2 lausetta):
    ${JSON.stringify(events.slice(0, 10))}`
  });

  return {
    events,
    summary
  };
}

