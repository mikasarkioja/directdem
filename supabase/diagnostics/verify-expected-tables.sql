-- =============================================================================
-- Eduskuntavahti / Omatase — verify public tables vs local repo inventory
-- Run in Supabase Dashboard → SQL Editor (read-only checks).
--
-- After run: rows with exists_in_db = false → "ghost" locally expected, apply SQL.
-- Part 2 lists DB tables not in inventory → possible "legacy" or manual objects.
-- =============================================================================

WITH expected (table_name) AS (
  VALUES
    ('achievements'),
    ('ai_usage_logs'),
    ('amendment_votes'),
    ('bill_ai_profiles'),
    ('bill_amendments'),
    ('bill_enhanced_profiles'),
    ('bill_forecasts'),
    ('bill_minutes_analysis'),
    ('bill_sections'),
    ('bill_tasks'),
    ('bill_user_submissions'),
    ('bills'),
    ('councilors'),
    ('decisions'),
    ('espoo_lobby_traces'),
    ('expert_statements'),
    ('feature_usage_logs'),
    ('historical_profiles'),
    ('integrity_alerts'),
    ('legislative_projects'),
    ('live_sessions'),
    ('lobbying_activity'),
    ('lobbyist_impact_analysis'),
    ('lobbyist_interventions'),
    ('lobbyist_meetings'),
    ('lobbyist_traces'),
    ('local_flips'),
    ('manifesto_update_votes'),
    ('manifesto_versions'),
    ('meeting_analysis'),
    ('meeting_votes'),
    ('moderation_reports'),
    ('mp_activity_stream'),
    ('mp_ai_profiles'),
    ('mp_candidate_responses'),
    ('mp_dependencies'),
    ('mp_dependency_history'),
    ('mp_interest_correlations'),
    ('mp_lobbying_data'),
    ('mp_profiles'),
    ('mp_profiles_new'),
    ('mp_votes'),
    ('mps'),
    ('municipal_cases'),
    ('municipal_councilor_profiles'),
    ('municipal_councilor_votes'),
    ('municipal_decisions'),
    ('municipal_votes'),
    ('newsletter_archive'),
    ('newsletter_subscribers'),
    ('party_members'),
    ('party_rankings'),
    ('party_stances'),
    ('predictions'),
    ('profiles'),
    ('research_notes'),
    ('shadow_statements'),
    ('transactions'),
    ('user_achievements'),
    ('user_actions_log'),
    ('user_archetypes'),
    ('user_badges'),
    ('user_follows'),
    ('user_impact_citations'),
    ('user_notifications'),
    ('user_predictions'),
    ('user_profile_history'),
    ('user_profiles'),
    ('user_pulse_votes'),
    ('virtual_parties'),
    ('votes'),
    ('voting_events')
)
SELECT
  e.table_name,
  EXISTS (
    SELECT 1
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      AND t.table_name = e.table_name
  ) AS exists_in_db,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.tables t
      WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
        AND t.table_name = e.table_name
    ) THEN 'OK or review columns'
    ELSE 'MISSING — run matching supabase/*.sql or script'
  END AS status
FROM expected e
ORDER BY e.table_name;

-- -----------------------------------------------------------------------------
-- Part 2: Tables present in public but NOT in the inventory above (legacy / extra)
-- -----------------------------------------------------------------------------
WITH expected (table_name) AS (
  VALUES
    ('achievements'), ('ai_usage_logs'), ('amendment_votes'), ('bill_ai_profiles'),
    ('bill_amendments'), ('bill_enhanced_profiles'), ('bill_forecasts'),
    ('bill_minutes_analysis'), ('bill_sections'), ('bill_tasks'),
    ('bill_user_submissions'), ('bills'), ('councilors'), ('decisions'),
    ('espoo_lobby_traces'), ('expert_statements'), ('feature_usage_logs'),
    ('historical_profiles'), ('integrity_alerts'), ('legislative_projects'),
    ('live_sessions'), ('lobbying_activity'), ('lobbyist_impact_analysis'),
    ('lobbyist_interventions'), ('lobbyist_meetings'), ('lobbyist_traces'),
    ('local_flips'), ('manifesto_update_votes'), ('manifesto_versions'),
    ('meeting_analysis'), ('meeting_votes'), ('moderation_reports'),
    ('mp_activity_stream'), ('mp_ai_profiles'), ('mp_candidate_responses'),
    ('mp_dependencies'), ('mp_dependency_history'), ('mp_interest_correlations'),
    ('mp_lobbying_data'), ('mp_profiles'), ('mp_profiles_new'), ('mp_votes'),
    ('mps'), ('municipal_cases'), ('municipal_councilor_profiles'),
    ('municipal_councilor_votes'), ('municipal_decisions'), ('municipal_votes'),
    ('newsletter_archive'), ('newsletter_subscribers'), ('party_members'),
    ('party_rankings'), ('party_stances'), ('predictions'), ('profiles'),
    ('research_notes'), ('shadow_statements'), ('transactions'),
    ('user_achievements'), ('user_actions_log'), ('user_archetypes'),
    ('user_badges'), ('user_follows'), ('user_impact_citations'),
    ('user_notifications'), ('user_predictions'), ('user_profile_history'),
    ('user_profiles'), ('user_pulse_votes'), ('virtual_parties'), ('votes'),
    ('voting_events')
)
SELECT t.table_name AS db_only_table
FROM information_schema.tables t
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND NOT EXISTS (
    SELECT 1 FROM expected e WHERE e.table_name = t.table_name
  )
ORDER BY t.table_name;

-- -----------------------------------------------------------------------------
-- Part 3: Example — verify a column from a migration (lobbyist_interventions)
-- Replace table_name / column_name as needed.
-- -----------------------------------------------------------------------------
-- SELECT EXISTS (
--   SELECT 1
--   FROM information_schema.columns c
--   WHERE c.table_schema = 'public'
--     AND c.table_name = 'lobbyist_interventions'
--     AND c.column_name = 'sentiment_score'
-- ) AS lobbyist_interventions_has_sentiment_score;
