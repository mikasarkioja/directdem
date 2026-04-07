-- Legislative projects (HE-tunnus) and lobbyist traceability for Eduskuntavahti / Omatase
-- Links optional bills row for app convenience; canonical key is he_tunnus (e.g. HE 123/2024).
--
-- Prerequisite: public.bills(id UUID) must exist (see supabase/schema.sql).
-- Apply: Supabase SQL Editor, or  npx tsx scripts/apply-lobbyist-schema.ts  (needs DATABASE_URL in .env.local)

CREATE TABLE IF NOT EXISTS public.legislative_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  he_tunnus TEXT NOT NULL,
  bill_id UUID REFERENCES public.bills(id) ON DELETE SET NULL,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT legislative_projects_he_tunnus_unique UNIQUE (he_tunnus)
);

CREATE INDEX IF NOT EXISTS idx_legislative_projects_bill_id
  ON public.legislative_projects(bill_id);

CREATE TABLE IF NOT EXISTS public.lobbyist_interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legislative_project_id UUID NOT NULL REFERENCES public.legislative_projects(id) ON DELETE CASCADE,
  organization_name TEXT NOT NULL,
  category TEXT,
  summary_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  sentiment_score NUMERIC(4, 3),
  source_url TEXT,
  source_type TEXT NOT NULL DEFAULT 'lausunto'
    CHECK (source_type IN ('lausunto', 'avoimuus', 'manual')),
  raw_excerpt TEXT,
  analysis_model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT lobbyist_interventions_sentiment_range CHECK (
    sentiment_score IS NULL OR (sentiment_score >= -1 AND sentiment_score <= 1)
  )
);

CREATE INDEX IF NOT EXISTS idx_lobbyist_interventions_project
  ON public.lobbyist_interventions(legislative_project_id);

CREATE INDEX IF NOT EXISTS idx_lobbyist_interventions_sentiment
  ON public.lobbyist_interventions(sentiment_score DESC NULLS LAST);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lobbyist_interventions_dedupe
  ON public.lobbyist_interventions(legislative_project_id, organization_name, source_type, COALESCE(source_url, ''));

CREATE OR REPLACE FUNCTION public.update_lobbyist_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_legislative_projects_updated_at ON public.legislative_projects;
CREATE TRIGGER trg_legislative_projects_updated_at
  BEFORE UPDATE ON public.legislative_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_lobbyist_tables_updated_at();

DROP TRIGGER IF EXISTS trg_lobbyist_interventions_updated_at ON public.lobbyist_interventions;
CREATE TRIGGER trg_lobbyist_interventions_updated_at
  BEFORE UPDATE ON public.lobbyist_interventions
  FOR EACH ROW EXECUTE FUNCTION public.update_lobbyist_tables_updated_at();

ALTER TABLE public.legislative_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lobbyist_interventions ENABLE ROW LEVEL SECURITY;

-- Service role (sync / server actions with service key)
DROP POLICY IF EXISTS "Service role full access legislative_projects" ON public.legislative_projects;
CREATE POLICY "Service role full access legislative_projects"
  ON public.legislative_projects FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access lobbyist_interventions" ON public.lobbyist_interventions;
CREATE POLICY "Service role full access lobbyist_interventions"
  ON public.lobbyist_interventions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Public read (citizen-facing UI; writes only via service_role)
DROP POLICY IF EXISTS "Public read legislative_projects" ON public.legislative_projects;
CREATE POLICY "Public read legislative_projects"
  ON public.legislative_projects FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public read lobbyist_interventions" ON public.lobbyist_interventions;
CREATE POLICY "Public read lobbyist_interventions"
  ON public.lobbyist_interventions FOR SELECT TO anon, authenticated
  USING (true);

COMMENT ON TABLE public.legislative_projects IS 'Finnish government bill / initiative key (HE-tunnus) for cross-source lobby traceability';
COMMENT ON TABLE public.lobbyist_interventions IS 'Structured stance summaries from lausunnot, Avoimuusrekisteri meeting logs, etc.';
COMMENT ON COLUMN public.lobbyist_interventions.summary_json IS 'LLM output: organization, category, stance, arguments, proposedChanges, plainLanguageSummary';
