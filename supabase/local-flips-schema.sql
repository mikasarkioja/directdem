-- 3. Paikalliset takinkäännöt (Local Flips)
CREATE TABLE IF NOT EXISTS public.local_flips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    councilor_id UUID REFERENCES public.councilors(id) ON DELETE CASCADE,
    meeting_id UUID REFERENCES public.meeting_analysis(id) ON DELETE CASCADE,
    axis TEXT NOT NULL, -- Esim. 'economy', 'environment'
    promise_score FLOAT, -- Alkuperäinen DNA
    action_impact FLOAT, -- Päätöksen DNA-vaikutus
    discrepancy FLOAT, -- Ero
    description TEXT, -- AI:n selitys ristiriidalle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Lisätään indeksi nopeaan hakuun
CREATE INDEX IF NOT EXISTS idx_local_flips_councilor ON public.local_flips(councilor_id);

