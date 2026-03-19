-- Espoo lobbyist traceability findings
CREATE TABLE IF NOT EXISTS public.espoo_lobby_traces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES public.municipal_decisions(id) ON DELETE CASCADE,
  actor_name TEXT NOT NULL,
  similarity_score FLOAT NOT NULL,
  impact_summary TEXT NOT NULL,
  high_influence BOOLEAN NOT NULL DEFAULT FALSE,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(decision_id, source_url)
);

CREATE INDEX IF NOT EXISTS idx_espoo_lobby_traces_decision
  ON public.espoo_lobby_traces(decision_id);

CREATE INDEX IF NOT EXISTS idx_espoo_lobby_traces_similarity
  ON public.espoo_lobby_traces(similarity_score DESC);

ALTER TABLE public.espoo_lobby_traces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access espoo_lobby_traces" ON public.espoo_lobby_traces;
CREATE POLICY "Service role full access espoo_lobby_traces"
  ON public.espoo_lobby_traces
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated read espoo_lobby_traces" ON public.espoo_lobby_traces;
CREATE POLICY "Authenticated read espoo_lobby_traces"
  ON public.espoo_lobby_traces
  FOR SELECT
  TO authenticated
  USING (true);
