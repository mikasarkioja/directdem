-- PostgREST .upsert(onConflict: 'dedupe_key') vaatii täyden unique-indeksin;
-- osittainen WHERE (dedupe_key IS NOT NULL) ei kelpaa conflict-kohteeksi.

DROP INDEX IF EXISTS idx_lobbyist_interventions_dedupe_key;

CREATE UNIQUE INDEX idx_lobbyist_interventions_dedupe_key
  ON public.lobbyist_interventions (dedupe_key);
