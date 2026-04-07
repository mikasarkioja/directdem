-- =============================================================================
-- Schema sync fix — idempotent, non-destructive (ADD IF NOT EXISTS, no DROP DATA)
-- Eduskuntavahti / Omatase
--
-- Scope: Known gaps between repo and typical live DB + bulletin upsert indexes.
-- After running this, paste diagnostics/export-public-schema.sql results to diff further.
-- Safe to re-run.
-- =============================================================================

-- Extensions (Supabase: usually allowed; skip in SQL Editor if permission denied)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Standard updated_at trigger helper (aligned with supabase/schema.sql naming)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- bill_enhanced_profiles (was only in scripts/setup-enhanced-bills.ts)
-- bill_id TEXT — parliament HE-id or MUNI-* keys; no FK to bills.id (UUID)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bill_enhanced_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT,
  complexity_score INTEGER DEFAULT 5,
  dna_impact_vector JSONB,
  analysis_data JSONB DEFAULT '{
        "simple_summary": "",
        "hotspots": [],
        "winners": [],
        "losers": [],
        "ideological_tradeoffs": ""
    }'::jsonb,
  forecast_metrics JSONB DEFAULT '{
        "friction_index": 0,
        "party_alignment_prediction": {},
        "voter_sensitivity": "Low",
        "precedent_bill_id": ""
    }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT bill_enhanced_profiles_bill_id_key UNIQUE (bill_id)
);

CREATE INDEX IF NOT EXISTS idx_bill_enhanced_profiles_bill_id
  ON public.bill_enhanced_profiles (bill_id);

DROP TRIGGER IF EXISTS trg_bill_enhanced_profiles_updated_at ON public.bill_enhanced_profiles;
CREATE TRIGGER trg_bill_enhanced_profiles_updated_at
  BEFORE UPDATE ON public.bill_enhanced_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.bill_enhanced_profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'bill_enhanced_profiles'
      AND policyname = 'bill_enhanced_profiles_select_public'
  ) THEN
    CREATE POLICY "bill_enhanced_profiles_select_public"
      ON public.bill_enhanced_profiles
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- bill_ai_profiles — expert + deep columns (add-bill-expert-deep-analysis.sql)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'bill_ai_profiles'
  ) THEN
    ALTER TABLE public.bill_ai_profiles
      ADD COLUMN IF NOT EXISTS expert_impact_assessment TEXT,
      ADD COLUMN IF NOT EXISTS deep_analysis TEXT;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- Bulletin feed upsert support (bulletin-feed-sync-support.sql)
-- Skips silently if base tables are missing (run weekly-bulletin-production-schema first).
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'municipal_decisions'
  ) THEN
    ALTER TABLE public.municipal_decisions
      ADD COLUMN IF NOT EXISTS decision_date TIMESTAMPTZ;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'lobbyist_traces'
  ) THEN
    ALTER TABLE public.lobbyist_traces
      ADD COLUMN IF NOT EXISTS source_intervention_id UUID;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'lobbyist_traces'
  ) THEN
    EXECUTE $idx$
      CREATE UNIQUE INDEX IF NOT EXISTS uniq_lobbyist_traces_source_intervention
        ON public.lobbyist_traces (source_intervention_id)
        WHERE source_intervention_id IS NOT NULL
    $idx$;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'decisions'
  ) THEN
    EXECUTE $idx$
      CREATE UNIQUE INDEX IF NOT EXISTS uniq_decisions_external_ref
        ON public.decisions (external_ref)
        WHERE external_ref IS NOT NULL
    $idx$;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'municipal_decisions'
  ) THEN
    EXECUTE $idx$
      CREATE UNIQUE INDEX IF NOT EXISTS uniq_municipal_decisions_muni_ext
        ON public.municipal_decisions (municipality, external_id)
        WHERE external_id IS NOT NULL
    $idx$;
  END IF;
END $$;
