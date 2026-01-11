import { createClient } from "@supabase/supabase-js";

/**
 * lib/eduskunta/activity-engine.ts
 * Calculates activity points for MPs based on speeches, questions, and votes.
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Activity weights
 */
const WEIGHTS = {
  SPEECH: 10,
  QUESTION: 15,
  VOTE: 2
};

/**
 * Calculates and updates activity index for an MP.
 */
export async function updateActivityIndex(mpId: string) {
  try {
    // 1. Fetch counts from activity stream
    const { data: activities } = await supabase
      .from("mp_activity_stream")
      .select("activity_type")
      .eq("mp_id", mpId);

    if (!activities) return 0;

    const speechCount = activities.filter(a => a.activity_type === "speech").length;
    const questionCount = activities.filter(a => a.activity_type === "question").length;
    
    // 2. Fetch vote count from voting tables (mocked for now or use real)
    const voteCount = 50; // Mock

    // 3. Calculate score
    const totalPoints = 
      (speechCount * WEIGHTS.SPEECH) + 
      (questionCount * WEIGHTS.QUESTION) + 
      (voteCount * WEIGHTS.VOTE);

    // 4. Update MP profile
    await supabase.from("mp_profiles").upsert({
      mp_id: parseInt(mpId),
      activity_index: totalPoints,
      updated_at: new Date().toISOString()
    }, { onConflict: "mp_id" });

    return totalPoints;
  } catch (error: any) {
    console.error("❌ Activity index calculation failed:", error.message);
    return 0;
  }
}

/**
 * Simulates lobbying data integration.
 */
export async function getRecentlyMetOrganizations(mpId: string) {
  // In reality, this would fetch from Avoimuusrekisteri API
  // or a table we sync from there.
  const mockOrganizations = [
    { name: "Elinkeinoelämän keskusliitto EK", date: "2025-12-15", topic: "Työmarkkinauudistus" },
    { name: "Suomen Ammattiliittojen Keskusjärjestö SAK", date: "2025-12-10", topic: "Sosiaaliturva" },
    { name: "WWF Suomi", date: "2025-12-05", topic: "Luontokato" }
  ];

  return mockOrganizations;
}

