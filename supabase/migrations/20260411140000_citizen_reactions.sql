-- Kansalaisreaktiot (pulssi + MP-areena) — Eduskuntavahti / Omatase
-- reaction_type: tuki = kannattaa / vastustaa / neutraali

CREATE TABLE IF NOT EXISTS public.citizen_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  bill_id UUID NOT NULL REFERENCES public.bills (id) ON DELETE CASCADE,
  mp_id INTEGER REFERENCES public.mps (id) ON DELETE SET NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('support', 'oppose', 'neutral')),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT citizen_reactions_user_bill_unique UNIQUE (user_id, bill_id)
);

CREATE INDEX IF NOT EXISTS idx_citizen_reactions_bill_id ON public.citizen_reactions (bill_id);
CREATE INDEX IF NOT EXISTS idx_citizen_reactions_mp_id ON public.citizen_reactions (mp_id);

DROP TRIGGER IF EXISTS trg_citizen_reactions_updated_at ON public.citizen_reactions;
CREATE TRIGGER trg_citizen_reactions_updated_at
  BEFORE UPDATE ON public.citizen_reactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.citizen_reactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'citizen_reactions' AND policyname = 'citizen_reactions_select_public'
  ) THEN
    CREATE POLICY "citizen_reactions_select_public"
      ON public.citizen_reactions FOR SELECT TO public USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'citizen_reactions' AND policyname = 'citizen_reactions_insert_own'
  ) THEN
    CREATE POLICY "citizen_reactions_insert_own"
      ON public.citizen_reactions FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'citizen_reactions' AND policyname = 'citizen_reactions_update_own'
  ) THEN
    CREATE POLICY "citizen_reactions_update_own"
      ON public.citizen_reactions FOR UPDATE TO authenticated
      USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'citizen_reactions' AND policyname = 'citizen_reactions_delete_own'
  ) THEN
    CREATE POLICY "citizen_reactions_delete_own"
      ON public.citizen_reactions FOR DELETE TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Yhteydenottokentät edustajalle (valinnaiset)
ALTER TABLE public.mps ADD COLUMN IF NOT EXISTS public_email TEXT;
ALTER TABLE public.mps ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE public.mps ADD COLUMN IF NOT EXISTS social_x_url TEXT;
ALTER TABLE public.mps ADD COLUMN IF NOT EXISTS social_facebook_url TEXT;
