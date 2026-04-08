-- Synkronointiloki (health check: sync_logs.last_sync)
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'success',
  last_sync TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_service ON public.sync_logs (service_name);
CREATE INDEX IF NOT EXISTS idx_sync_logs_last_sync ON public.sync_logs (last_sync DESC);

ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read sync_logs" ON public.sync_logs;
CREATE POLICY "Public read sync_logs"
  ON public.sync_logs FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role full access sync_logs" ON public.sync_logs;
CREATE POLICY "Service role full access sync_logs"
  ON public.sync_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.sync_logs IS 'Batch/cron-ajojen onnistumismerkinnät (service_role -kirjoitus).';
