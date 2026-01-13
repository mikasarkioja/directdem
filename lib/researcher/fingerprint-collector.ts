import { createClient } from "@/lib/supabase/server";

/**
 * Collects all relevant data for an MP to generate a "Political Fingerprint".
 */
export async function collectMPFingerprintData(mpId: string | number) {
  const supabase = await createClient();

  // 1. Fetch MP Basic Info
  const { data: mp } = await supabase
    .from("mps")
    .select(`
      *,
      mp_profiles (
        activity_index,
        economic_score,
        liberal_conservative_score,
        environmental_score,
        urban_rural_score,
        international_national_score,
        security_score
      )
    `)
    .eq("id", mpId)
    .single();

  if (!mp) throw new Error("MP not found");

  // 2. Fetch AI Profile (Rhetoric, Meetings, etc.)
  const { data: aiProfile } = await supabase
    .from("mp_ai_profiles")
    .select("*")
    .eq("mp_id", mpId.toString())
    .single();

  // 3. Fetch Dependency History
  const { data: dependencies } = await supabase
    .from("mp_dependencies")
    .select("*")
    .eq("mp_id", mpId);

  const { data: dependencyHistory } = await supabase
    .from("mp_dependency_history")
    .select("*")
    .eq("mp_id", mpId)
    .order("detected_at", { ascending: false });

  // 4. Fetch Lobbyist Meetings (from table if exists, fallback to JSON in profile)
  const { data: tableMeetings } = await supabase
    .from("lobbyist_meetings")
    .select("*")
    .eq("mp_id", mpId);

  const lobbyistMeetings = tableMeetings && tableMeetings.length > 0 
    ? tableMeetings 
    : (aiProfile?.lobbyist_meetings || []);

  // 5. Fetch Interest Correlations
  const { data: correlations } = await supabase
    .from("mp_interest_correlations")
    .select("*")
    .eq("mp_id", mpId);

  // 6. Fetch Voting History (Top 20 recent votes for context)
  // Note: Assuming a votes table or similar exists
  const { data: votes } = await supabase
    .from("integrity_alerts") // Using integrity alerts as a proxy for interesting votes
    .select("*")
    .eq("mp_id", mpId)
    .limit(20);

  return {
    mp,
    aiProfile: {
      rhetoric_style: aiProfile?.rhetoric_style,
      system_prompt: aiProfile?.system_prompt,
      current_sentiment: aiProfile?.current_sentiment,
      regional_bias: aiProfile?.regional_bias
    },
    dependencies,
    dependencyHistory,
    lobbyistMeetings,
    correlations,
    votes,
    timestamp: new Date().toISOString()
  };
}

