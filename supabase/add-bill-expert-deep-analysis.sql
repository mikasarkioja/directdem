-- Pre-processed citizen-facing narratives (batch / editorial pipeline).
-- expert_impact_assessment: ~8k asiantuntijaselonteko & vaikutusarviointi
-- deep_analysis: ~25k AI + talous + asiantuntijan perustelut + etujärjestökenttä (syväanalyysi)

ALTER TABLE public.bill_ai_profiles
  ADD COLUMN IF NOT EXISTS expert_impact_assessment TEXT,
  ADD COLUMN IF NOT EXISTS deep_analysis TEXT;

COMMENT ON COLUMN public.bill_ai_profiles.expert_impact_assessment IS
  'Asiantuntijaselonteko ja vaikutusarviointi (n. 8000 merkkiä), esim. batch-generoitu.';
COMMENT ON COLUMN public.bill_ai_profiles.deep_analysis IS
  'Syväanalyysi: AI + talous, asiantuntijan näkemys tarpeesta ja etujärjestöjen arvio; tavoite n. 25 000 merkkiä; laajennettu näkymä.';
