-- Ennalta lasketut yhteenvedot (esim. Päivän pulssi); cron päivittää, dashboard lukee

CREATE TABLE IF NOT EXISTS public.cached_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cached_summaries_key ON public.cached_summaries (cache_key);
CREATE INDEX IF NOT EXISTS idx_cached_summaries_generated ON public.cached_summaries (generated_at DESC);

CREATE OR REPLACE FUNCTION public.touch_cached_summaries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cached_summaries_updated_at ON public.cached_summaries;
CREATE TRIGGER trg_cached_summaries_updated_at
  BEFORE UPDATE ON public.cached_summaries
  FOR EACH ROW EXECUTE FUNCTION public.touch_cached_summaries_updated_at();

ALTER TABLE public.cached_summaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read cached_summaries" ON public.cached_summaries;
CREATE POLICY "Public read cached_summaries"
  ON public.cached_summaries FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role write cached_summaries" ON public.cached_summaries;
CREATE POLICY "Service role write cached_summaries"
  ON public.cached_summaries FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.cached_summaries IS 'Päivän pulssi ja muut esilasketut tekstitiivistelmät (instant load).';
