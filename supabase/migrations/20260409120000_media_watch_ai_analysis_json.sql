-- Grounding-lähteet ja viitteet (Google Search) erillisenä rakenteena
--
-- AJOJÄRJESTYS: Tämä migraatio olettaa, että seuraava on jo ajettu samassa tietokannassa:
--   supabase/migrations/20260408120000_news_media_watch.sql
-- Se luo public.news_decision_matches, news_articles ja media_watch_feed -näkymän.
-- (Vaatii myös taulut public.bills, public.decisions, public.municipal_decisions.)
--
DO $guard$
BEGIN
  IF to_regclass('public.news_decision_matches') IS NULL THEN
    RAISE EXCEPTION
      'public.news_decision_matches puuttuu. Aja ensin migraatio 20260408120000_news_media_watch.sql (Dashboard → SQL tai supabase db push), sen jälkeen tämä tiedosto.';
  END IF;
END
$guard$;

ALTER TABLE public.news_decision_matches
  ADD COLUMN IF NOT EXISTS ai_analysis_json JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.news_decision_matches.ai_analysis_json IS
  'Media Watch: grounding sources, citation supports, flags (JSON).';

-- Näkymä: mukaan ai_analysis_json (uusi sarake VIIMESTENÄ: REPLACE VIEW ei saa vaihtaa
-- aiempien sarakkeiden järjestystä, muuten PostgreSQL tulkitsee sen rename-virheeksi.)
CREATE OR REPLACE VIEW public.media_watch_feed AS
SELECT
  nm.id AS match_id,
  nm.similarity_score,
  nm.ai_analysis_summary,
  nm.created_at AS matched_at,
  na.id AS news_id,
  na.title AS news_title,
  na.content AS news_content,
  na.source_url AS news_url,
  na.source_name AS news_source_name,
  na.published_at AS news_published_at,
  nm.decision_id,
  nm.bill_id,
  nm.municipal_decision_id,
  d.title AS decision_title,
  d.summary AS decision_summary,
  d.external_ref AS decision_external_ref,
  b.title AS bill_title,
  b.summary AS bill_summary,
  b.parliament_id AS bill_parliament_id,
  m.title AS municipal_title,
  m.summary AS municipal_summary,
  m.municipality AS municipal_municipality,
  m.url AS municipal_url,
  nm.ai_analysis_json
FROM public.news_decision_matches nm
JOIN public.news_articles na ON na.id = nm.news_id
LEFT JOIN public.decisions d ON d.id = nm.decision_id
LEFT JOIN public.bills b ON b.id = nm.bill_id
LEFT JOIN public.municipal_decisions m ON m.id = nm.municipal_decision_id;
