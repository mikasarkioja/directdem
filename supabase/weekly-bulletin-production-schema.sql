-- =============================================================================
-- Weekly bulletin + Eduskuntavahti feed — production setup (Supabase SQL Editor)
-- =============================================================================
-- Run this ONCE in Supabase → SQL → New query, then verify tables in Table Editor.
--
-- Prerequisites (run these first if you have not yet):
--   • supabase/newsletter-subscribers-schema.sql   (newsletter_subscribers)
--   • supabase/add-profiles-is-admin.sql           (profiles.is_admin, optional)
--   • supabase/espoo-lobby-traces-schema.sql       (espoo_lobby_traces; requires
--     public.municipal_decisions — created below)
--
-- After this migration, set in Vercel / hosting:
--   • OPENAI_API_KEY        — required for real bulletin copy (gpt-4o in generator)
--   • RESEND_API_KEY        — email send
--   • RESEND_FROM_EMAIL     — verified domain in production
--   • CRON_SECRET           — Bearer token for /api/cron/weekly-bulletin
--   • SUPABASE_SERVICE_ROLE_KEY — server/cron only (never in browser)
--
-- Data: populate public.decisions, public.lobbyist_traces, public.municipal_decisions
-- (Espoo rows feed public.espoo_decisions view). Empty tables = bulletin still runs
-- but OpenAI gets empty arrays (generic text). espoo_lobby_traces fills from your
-- municipal scan pipeline.
-- =============================================================================

-- 1) National “decisions” feed (parliament highlights — not the same as bills.id)
CREATE TABLE IF NOT EXISTS public.decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT,
  impact_score DOUBLE PRECISION DEFAULT 0,
  source_type TEXT DEFAULT 'parliament',
  external_ref TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_decisions_created_impact
  ON public.decisions (created_at DESC, impact_score DESC NULLS LAST);

-- 2) Lobby radar rows for bulletin (denormalized; can sync from lobbyist_interventions)
CREATE TABLE IF NOT EXISTS public.lobbyist_traces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name TEXT NOT NULL,
  analysis_summary TEXT,
  similarity_score DOUBLE PRECISION NOT NULL DEFAULT 0,
  impact_score DOUBLE PRECISION DEFAULT 0,
  bill_id UUID REFERENCES public.bills (id) ON DELETE SET NULL,
  legislative_project_id UUID,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lobbyist_traces_similarity
  ON public.lobbyist_traces (similarity_score DESC);

CREATE INDEX IF NOT EXISTS idx_lobbyist_traces_created
  ON public.lobbyist_traces (created_at DESC);

-- 3) Municipal decisions (Espoo + others). Referenced by espoo_lobby_traces.decision_id
CREATE TABLE IF NOT EXISTS public.municipal_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  municipality TEXT NOT NULL DEFAULT 'Espoo',
  external_id TEXT,
  title TEXT NOT NULL,
  summary TEXT,
  category TEXT,
  neighborhood TEXT,
  impact_score DOUBLE PRECISION DEFAULT 0,
  url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_municipal_decisions_muni_created
  ON public.municipal_decisions (municipality, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_municipal_decisions_impact
  ON public.municipal_decisions (impact_score DESC NULLS LAST);

-- 4) View used by lib/bulletin/generator.ts (Espoo subset only)
DROP VIEW IF EXISTS public.espoo_decisions;
CREATE VIEW public.espoo_decisions AS
SELECT
  id,
  title,
  summary,
  category,
  neighborhood,
  impact_score,
  created_at
FROM public.municipal_decisions
WHERE lower(trim(municipality)) = 'espoo';

-- 5) Newsletter HTML archive (cron insert)
CREATE TABLE IF NOT EXISTS public.newsletter_archive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generated_html TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_archive_sent
  ON public.newsletter_archive (sent_at DESC);

-- ---------------------------------------------------------------------------
-- RLS: public read for feeds; writes via service_role (cron, server actions)
-- ---------------------------------------------------------------------------
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lobbyist_traces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.municipal_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_archive ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read decisions" ON public.decisions;
CREATE POLICY "Public read decisions"
  ON public.decisions FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role full access decisions" ON public.decisions;
CREATE POLICY "Service role full access decisions"
  ON public.decisions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public read lobbyist_traces" ON public.lobbyist_traces;
CREATE POLICY "Public read lobbyist_traces"
  ON public.lobbyist_traces FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role full access lobbyist_traces" ON public.lobbyist_traces;
CREATE POLICY "Service role full access lobbyist_traces"
  ON public.lobbyist_traces FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public read municipal_decisions" ON public.municipal_decisions;
CREATE POLICY "Public read municipal_decisions"
  ON public.municipal_decisions FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role full access municipal_decisions" ON public.municipal_decisions;
CREATE POLICY "Service role full access municipal_decisions"
  ON public.municipal_decisions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access newsletter_archive" ON public.newsletter_archive;
CREATE POLICY "Service role full access newsletter_archive"
  ON public.newsletter_archive FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.decisions IS 'National feed rows for weekly bulletin / dashboards';
COMMENT ON TABLE public.lobbyist_traces IS 'Lobby radar summaries for weekly bulletin';
COMMENT ON TABLE public.municipal_decisions IS 'Municipal cases; Espoo filter exposed as view espoo_decisions';
COMMENT ON VIEW public.espoo_decisions IS 'Municipal decisions where municipality = Espoo (bulletin + UI)';
COMMENT ON TABLE public.newsletter_archive IS 'Stored HTML for sent weekly bulletins';
