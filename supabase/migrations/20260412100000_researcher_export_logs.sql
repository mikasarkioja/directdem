-- Tutkijatyöpöydän aineistovientien audit-loki (sisäinen analytiikka)

CREATE TABLE IF NOT EXISTS public.researcher_export_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  dataset_key TEXT NOT NULL,
  export_format TEXT NOT NULL CHECK (export_format IN ('csv', 'json')),
  row_count INTEGER NOT NULL DEFAULT 0,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  ai_insight_requested BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_researcher_export_logs_user ON public.researcher_export_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_researcher_export_logs_created ON public.researcher_export_logs (created_at DESC);

ALTER TABLE public.researcher_export_logs ENABLE ROW LEVEL SECURITY;

-- Vain service role (palvelintoiminnot / admin-client); ei julkista SELECTiä
DROP POLICY IF EXISTS "Service role all researcher_export_logs" ON public.researcher_export_logs;
CREATE POLICY "Service role all researcher_export_logs"
  ON public.researcher_export_logs FOR ALL TO service_role
  USING (true) WITH CHECK (true);
