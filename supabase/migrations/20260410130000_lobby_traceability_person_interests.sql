-- Lobbyist traceability: sidonnaisuudet (person interests), valiokuntien asiantuntijakuulemiset (Vaski),
-- ja lausunto-PDF:ien metatiedot.

CREATE OR REPLACE FUNCTION public.update_lobbyist_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1) Sidonnaisuusilmoitukset: kansanedustaja (mps) tai valtuutettu (kunta + ulkoinen tunniste)
CREATE TABLE IF NOT EXISTS public.person_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type TEXT NOT NULL CHECK (subject_type IN ('mp', 'councilor')),
  mp_id INTEGER REFERENCES public.mps (id) ON DELETE CASCADE,
  council_municipality TEXT,
  councilor_external_ref TEXT,
  person_display_name TEXT NOT NULL,
  interest_organization TEXT NOT NULL,
  interest_organization_normalized TEXT NOT NULL,
  role_or_relation TEXT,
  declaration_url TEXT NOT NULL,
  declaration_date DATE,
  source_register_label TEXT,
  raw_excerpt TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT person_interests_subject_ck CHECK (
    (subject_type = 'mp' AND mp_id IS NOT NULL AND council_municipality IS NULL)
    OR (
      subject_type = 'councilor'
      AND council_municipality IS NOT NULL
      AND mp_id IS NULL
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_person_interests_mp
  ON public.person_interests (mp_id)
  WHERE mp_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_person_interests_council
  ON public.person_interests (council_municipality, councilor_external_ref);

CREATE INDEX IF NOT EXISTS idx_person_interests_org_norm
  ON public.person_interests (interest_organization_normalized);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_person_interests_dedupe
  ON public.person_interests (person_display_name, interest_organization_normalized, declaration_url);

COMMENT ON TABLE public.person_interests IS 'Sidonnaisuusilmoitukset virallisista lähteistä; ei automaattista oikeudellista tulkintaa.';
COMMENT ON COLUMN public.person_interests.interest_organization_normalized IS 'Alaviivat: normalizeOrganization() (lib/lobby/org-normalize.ts)';

DROP TRIGGER IF EXISTS trg_person_interests_updated_at ON public.person_interests;
CREATE TRIGGER trg_person_interests_updated_at
  BEFORE UPDATE ON public.person_interests
  FOR EACH ROW EXECUTE FUNCTION public.update_lobbyist_tables_updated_at();

ALTER TABLE public.person_interests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read person_interests" ON public.person_interests;
CREATE POLICY "Public read person_interests"
  ON public.person_interests FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role full access person_interests" ON public.person_interests;
CREATE POLICY "Service role full access person_interests"
  ON public.person_interests FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 2) Vaski Asiantuntijalausunto — valiokunnan kuulema (virallinen avoin data)
CREATE TABLE IF NOT EXISTS public.committee_expert_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vaski_row_id TEXT NOT NULL,
  eduskunta_tunnus TEXT,
  committee_code TEXT,
  session_date_raw TEXT,
  title_plain TEXT NOT NULL,
  expert_name TEXT,
  expert_organization TEXT,
  expert_organization_normalized TEXT,
  pdf_url TEXT,
  legislative_project_id UUID REFERENCES public.legislative_projects (id) ON DELETE SET NULL,
  he_tunnus TEXT,
  source_api_url TEXT NOT NULL DEFAULT 'https://avoindata.eduskunta.fi/api/v1/vaski/asiakirjatyyppinimi',
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT committee_expert_invites_vaski_unique UNIQUE (vaski_row_id)
);

CREATE INDEX IF NOT EXISTS idx_committee_expert_invites_he
  ON public.committee_expert_invites (he_tunnus);

CREATE INDEX IF NOT EXISTS idx_committee_expert_invites_seen
  ON public.committee_expert_invites (first_seen_at DESC);

COMMENT ON TABLE public.committee_expert_invites IS 'Valiokuntien asiantuntijakuulemiset / Asiantuntijalausunto-asiakirjat (Eduskunnan Vaski, avointa dataa).';

ALTER TABLE public.committee_expert_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read committee_expert_invites" ON public.committee_expert_invites;
CREATE POLICY "Public read committee_expert_invites"
  ON public.committee_expert_invites FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role full access committee_expert_invites" ON public.committee_expert_invites;
CREATE POLICY "Service role full access committee_expert_invites"
  ON public.committee_expert_invites FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 3) Lausunto-PDF / liite: metatiedot vs. odotettu organisaatio
CREATE TABLE IF NOT EXISTS public.lobby_statement_document_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lobbyist_intervention_id UUID NOT NULL REFERENCES public.lobbyist_interventions (id) ON DELETE CASCADE,
  pdf_url TEXT NOT NULL,
  author_field TEXT,
  creator_field TEXT,
  producer_field TEXT,
  title_field TEXT,
  expected_organization TEXT NOT NULL,
  author_mismatch BOOLEAN NOT NULL DEFAULT false,
  inspected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT lobby_stmt_meta_unique UNIQUE (lobbyist_intervention_id, pdf_url)
);

CREATE INDEX IF NOT EXISTS idx_lobby_stmt_meta_mismatch
  ON public.lobby_statement_document_metadata (author_mismatch)
  WHERE author_mismatch = true;

COMMENT ON TABLE public.lobby_statement_document_metadata IS 'PDF Author/Creator vs. odotettu järjestö; mismatch on tekninen signaali, ei todiste väärinkäytöksestä.';

ALTER TABLE public.lobby_statement_document_metadata ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read lobby_statement_document_metadata" ON public.lobby_statement_document_metadata;
CREATE POLICY "Public read lobby_statement_document_metadata"
  ON public.lobby_statement_document_metadata FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role full access lobby_statement_document_metadata" ON public.lobby_statement_document_metadata;
CREATE POLICY "Service role full access lobby_statement_document_metadata"
  ON public.lobby_statement_document_metadata FOR ALL TO service_role
  USING (true) WITH CHECK (true);
