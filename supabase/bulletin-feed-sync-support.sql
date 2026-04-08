-- Support for idempotent bulletin feed sync (run after weekly-bulletin-production-schema.sql)
-- Enables upserts from lib/bulletin/sync-feed-from-sources.ts

ALTER TABLE public.municipal_decisions
  ADD COLUMN IF NOT EXISTS decision_date TIMESTAMPTZ;

ALTER TABLE public.lobbyist_traces
  ADD COLUMN IF NOT EXISTS source_intervention_id UUID;

-- One trace row per lobbyist_interventions row when syncing from interventions
-- Täysi unique-indeksi: PostgREST upsert (onConflict) ei tue osittaista WHERE-indeksiä.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_lobbyist_traces_source_intervention
  ON public.lobbyist_traces (source_intervention_id);

-- Upsert key for decisions synced from bills (HE-tunnus or bill UUID)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_decisions_external_ref
  ON public.decisions (external_ref);

-- Upsert key for municipal_cases → municipal_decisions
CREATE UNIQUE INDEX IF NOT EXISTS uniq_municipal_decisions_muni_ext
  ON public.municipal_decisions (municipality, external_id);
