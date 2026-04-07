-- =============================================================================
-- Weekly bulletin + Eduskuntavahti feed — production setup (Supabase SQL Editor)
-- =============================================================================
-- Run this ONCE in Supabase → SQL → New query, then verify tables in Table Editor.
--
-- Prerequisites (run these first if you have not yet):
--   • public.bills must exist before lobbyist_traces (FK) — Eduskunta / bills migration
--   • supabase/newsletter-subscribers-schema.sql   (newsletter_subscribers)
--   • supabase/add-profiles-is-admin.sql           (profiles.is_admin, optional)
-- If espoo_lobby_traces ran first, it may have created a stub municipal_decisions;
-- this file adds missing columns (e.g. created_at) before indexes/views.
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

-- If this table existed already without audit columns, CREATE TABLE above is a no-op — add missing cols first.
ALTER TABLE public.decisions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.decisions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.decisions ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.decisions ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE public.decisions ADD COLUMN IF NOT EXISTS impact_score DOUBLE PRECISION DEFAULT 0;
ALTER TABLE public.decisions ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'parliament';
ALTER TABLE public.decisions ADD COLUMN IF NOT EXISTS external_ref TEXT;
ALTER TABLE public.decisions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

UPDATE public.decisions SET title = '(ei otsikkoa)' WHERE title IS NULL;
ALTER TABLE public.decisions ALTER COLUMN title SET NOT NULL;

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
  source_intervention_id UUID,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.lobbyist_traces ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.lobbyist_traces ADD COLUMN IF NOT EXISTS organization_name TEXT;
ALTER TABLE public.lobbyist_traces ADD COLUMN IF NOT EXISTS analysis_summary TEXT;
ALTER TABLE public.lobbyist_traces ADD COLUMN IF NOT EXISTS similarity_score DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE public.lobbyist_traces ADD COLUMN IF NOT EXISTS impact_score DOUBLE PRECISION DEFAULT 0;
ALTER TABLE public.lobbyist_traces ADD COLUMN IF NOT EXISTS bill_id UUID;
ALTER TABLE public.lobbyist_traces ADD COLUMN IF NOT EXISTS legislative_project_id UUID;
ALTER TABLE public.lobbyist_traces ADD COLUMN IF NOT EXISTS source_intervention_id UUID;
ALTER TABLE public.lobbyist_traces ADD COLUMN IF NOT EXISTS source_url TEXT;

UPDATE public.lobbyist_traces SET organization_name = '(tuntematon)' WHERE organization_name IS NULL;
ALTER TABLE public.lobbyist_traces ALTER COLUMN organization_name SET NOT NULL;

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
  decision_date TIMESTAMPTZ,
  url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Common failure: espoo_lobby_traces (or other SQL) referenced municipal_decisions before this file ran;
-- a minimal table may exist without created_at — indexes + espoo_decisions view need these columns.
ALTER TABLE public.municipal_decisions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.municipal_decisions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.municipal_decisions ADD COLUMN IF NOT EXISTS municipality TEXT DEFAULT 'Espoo';
ALTER TABLE public.municipal_decisions ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE public.municipal_decisions ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.municipal_decisions ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE public.municipal_decisions ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.municipal_decisions ADD COLUMN IF NOT EXISTS neighborhood TEXT;
ALTER TABLE public.municipal_decisions ADD COLUMN IF NOT EXISTS impact_score DOUBLE PRECISION DEFAULT 0;
ALTER TABLE public.municipal_decisions ADD COLUMN IF NOT EXISTS decision_date TIMESTAMPTZ;
ALTER TABLE public.municipal_decisions ADD COLUMN IF NOT EXISTS url TEXT;

-- NOT NULL title: legacy rows with NULL title would violate generator expectations
UPDATE public.municipal_decisions SET title = '(ei otsikkoa)' WHERE title IS NULL;
ALTER TABLE public.municipal_decisions ALTER COLUMN title SET DEFAULT '(ei otsikkoa)';
ALTER TABLE public.municipal_decisions ALTER COLUMN title SET NOT NULL;

UPDATE public.municipal_decisions SET municipality = 'Espoo' WHERE municipality IS NULL OR trim(municipality) = '';
ALTER TABLE public.municipal_decisions ALTER COLUMN municipality SET NOT NULL;
ALTER TABLE public.municipal_decisions ALTER COLUMN municipality SET DEFAULT 'Espoo';

CREATE INDEX IF NOT EXISTS idx_municipal_decisions_muni_created
  ON public.municipal_decisions (municipality, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_municipal_decisions_impact
  ON public.municipal_decisions (impact_score DESC NULLS LAST);

-- Upsert keys for lib/bulletin/sync-feed-from-sources.ts (idempotent cron / CLI sync)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_decisions_external_ref
  ON public.decisions (external_ref)
  WHERE external_ref IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_lobbyist_traces_source_intervention
  ON public.lobbyist_traces (source_intervention_id)
  WHERE source_intervention_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_municipal_decisions_muni_ext
  ON public.municipal_decisions (municipality, external_id)
  WHERE external_id IS NOT NULL;

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
