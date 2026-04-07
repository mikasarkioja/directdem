-- Media Watch / News vs. decision corpus (pgvector + Gemini pipeline support)
-- Requires: public.bills, public.decisions, public.municipal_decisions

CREATE EXTENSION IF NOT EXISTS vector;

-- -----------------------------------------------------------------------------
-- news_articles
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  source_url TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  embedding vector(1536),
  source_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT news_articles_source_url_key UNIQUE (source_url)
);

CREATE INDEX IF NOT EXISTS idx_news_articles_published_at
  ON public.news_articles (published_at DESC NULLS LAST);

-- -----------------------------------------------------------------------------
-- Embeddings on decision corpus (nullable until backfilled)
-- -----------------------------------------------------------------------------
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE public.decisions ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE public.municipal_decisions ADD COLUMN IF NOT EXISTS embedding vector(1536);

CREATE INDEX IF NOT EXISTS idx_bills_embedding_ivfflat
  ON public.bills USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50)
  WHERE embedding IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_decisions_embedding_ivfflat
  ON public.decisions USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50)
  WHERE embedding IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_municipal_decisions_embedding_ivfflat
  ON public.municipal_decisions USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50)
  WHERE embedding IS NOT NULL;

-- -----------------------------------------------------------------------------
-- news_decision_matches
-- Tasan yksi kohde: kansallinen decisions-rivi, bills-rivi (HE) tai kunnallinen päätös.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.news_decision_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id UUID NOT NULL REFERENCES public.news_articles (id) ON DELETE CASCADE,
  decision_id UUID REFERENCES public.decisions (id) ON DELETE CASCADE,
  bill_id UUID REFERENCES public.bills (id) ON DELETE CASCADE,
  municipal_decision_id UUID REFERENCES public.municipal_decisions (id) ON DELETE CASCADE,
  similarity_score DOUBLE PRECISION NOT NULL,
  ai_analysis_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT news_decision_matches_one_target CHECK (
    (decision_id IS NOT NULL)::int
    + (bill_id IS NOT NULL)::int
    + (municipal_decision_id IS NOT NULL)::int = 1
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_news_decision_match_bill
  ON public.news_decision_matches (news_id, bill_id)
  WHERE bill_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_news_decision_match_decision
  ON public.news_decision_matches (news_id, decision_id)
  WHERE decision_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_news_decision_match_municipal
  ON public.news_decision_matches (news_id, municipal_decision_id)
  WHERE municipal_decision_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_news_decision_matches_news
  ON public.news_decision_matches (news_id);

-- -----------------------------------------------------------------------------
-- Vector similarity over bills + decisions + municipal_decisions
-- similarity = 1 - cosine_distance (assumes normalized OpenAI embeddings)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.match_news_to_decision_corpus(
  query_embedding vector(1536),
  match_threshold double precision DEFAULT 0.85,
  match_count integer DEFAULT 8
)
RETURNS TABLE (
  corpus_type text,
  record_id uuid,
  similarity double precision
)
LANGUAGE sql
STABLE
AS $$
  SELECT sub.corpus_type, sub.record_id, sub.similarity
  FROM (
    SELECT
      'bill'::text AS corpus_type,
      b.id AS record_id,
      (1 - (b.embedding <=> query_embedding))::double precision AS similarity
    FROM public.bills b
    WHERE b.embedding IS NOT NULL
    UNION ALL
    SELECT
      'decision'::text,
      d.id,
      (1 - (d.embedding <=> query_embedding))::double precision
    FROM public.decisions d
    WHERE d.embedding IS NOT NULL
    UNION ALL
    SELECT
      'municipal_decision'::text,
      m.id,
      (1 - (m.embedding <=> query_embedding))::double precision
    FROM public.municipal_decisions m
    WHERE m.embedding IS NOT NULL
  ) AS sub
  WHERE sub.similarity >= match_threshold
  ORDER BY sub.similarity DESC
  LIMIT match_count;
$$;

GRANT EXECUTE ON FUNCTION public.match_news_to_decision_corpus(vector(1536), double precision, integer)
  TO anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Read model for dashboard (SECURITY INVOKER: RLS on base tables applies)
-- -----------------------------------------------------------------------------
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
  m.url AS municipal_url
FROM public.news_decision_matches nm
JOIN public.news_articles na ON na.id = nm.news_id
LEFT JOIN public.decisions d ON d.id = nm.decision_id
LEFT JOIN public.bills b ON b.id = nm.bill_id
LEFT JOIN public.municipal_decisions m ON m.id = nm.municipal_decision_id;

GRANT SELECT ON public.media_watch_feed TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_decision_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read news_articles" ON public.news_articles;
CREATE POLICY "Public read news_articles"
  ON public.news_articles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public read news_decision_matches" ON public.news_decision_matches;
CREATE POLICY "Public read news_decision_matches"
  ON public.news_decision_matches FOR SELECT
  USING (true);

COMMENT ON TABLE public.news_articles IS 'Synkronoitu uutisfeed; embedding headline+snippet (OpenAI 1536).';
COMMENT ON TABLE public.news_decision_matches IS 'Semanttinen osuma uutinen ↔ päätös/kunta/laki + Gemini-analyysi.';
COMMENT ON FUNCTION public.match_news_to_decision_corpus IS 'Cosine similarity 1-distance; threshold default 0.85.';
