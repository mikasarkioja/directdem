-- Laajenna lobbyist_interventions: valiokunta-asiantuntijat + lausuntopalvelu-rivit
-- (Weekly Bulletin / editorial spotlight)

ALTER TABLE public.lobbyist_interventions
  ADD COLUMN IF NOT EXISTS bill_id UUID REFERENCES public.bills(id) ON DELETE SET NULL;

ALTER TABLE public.lobbyist_interventions
  ADD COLUMN IF NOT EXISTS source_external_id TEXT;

COMMENT ON COLUMN public.lobbyist_interventions.bill_id IS 'Valinnainen suora viittaus bills.id (denormalisoitu legislative_projects.bill_id:stä).';
COMMENT ON COLUMN public.lobbyist_interventions.source_external_id IS 'Idempotentti avain (esim. Vaski vaski_row_id, lausunto URL-hash).';

ALTER TABLE public.lobbyist_interventions
  DROP CONSTRAINT IF EXISTS lobbyist_interventions_source_type_check;

ALTER TABLE public.lobbyist_interventions
  ADD CONSTRAINT lobbyist_interventions_source_type_check
  CHECK (
    source_type IN (
      'lausunto',
      'avoimuus',
      'manual',
      'expert_hearing',
      'statement'
    )
  );

-- Idempotentti upsert (PostgREST onConflict); ei riipu COALESCE-lausekkeesta unique-indeksissä
ALTER TABLE public.lobbyist_interventions
  ADD COLUMN IF NOT EXISTS dedupe_key TEXT;

-- Täysi unique-indeksi (ei WHERE); PostgREST upsert. Useita NULL-dedupe_key -rivejä sallittu PG:ssä.
CREATE UNIQUE INDEX IF NOT EXISTS idx_lobbyist_interventions_dedupe_key
  ON public.lobbyist_interventions (dedupe_key);

COMMENT ON COLUMN public.lobbyist_interventions.dedupe_key IS 'Vakio avain idempotenssiin: esim. vaski_expert:<vaski_row_id>, lausunto:<sha256(url)>.';

CREATE INDEX IF NOT EXISTS idx_lobbyist_interventions_bill_id
  ON public.lobbyist_interventions (bill_id)
  WHERE bill_id IS NOT NULL;
