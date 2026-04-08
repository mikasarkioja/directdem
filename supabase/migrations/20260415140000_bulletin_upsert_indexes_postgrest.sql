-- PostgREST upsert vaatii täydet unique-indeksit (ei WHERE-ehtoa conflict-kohteessa).
-- bulletin-feed-sync-support.sql loi aiemmin osittaiset indeksit.

DROP INDEX IF EXISTS uniq_lobbyist_traces_source_intervention;
CREATE UNIQUE INDEX uniq_lobbyist_traces_source_intervention
  ON public.lobbyist_traces (source_intervention_id);

DROP INDEX IF EXISTS uniq_decisions_external_ref;
CREATE UNIQUE INDEX uniq_decisions_external_ref
  ON public.decisions (external_ref);

DROP INDEX IF EXISTS uniq_municipal_decisions_muni_ext;
CREATE UNIQUE INDEX uniq_municipal_decisions_muni_ext
  ON public.municipal_decisions (municipality, external_id);
