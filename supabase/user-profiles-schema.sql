-- Luo user_profiles taulu Varjokansanedustajan profiilitietoja varten
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    shadow_id_number TEXT UNIQUE,
    committee_assignment TEXT,
    rank_title TEXT,
    impact_points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS-politiikat
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Käyttäjät voivat nähdä omat tietonsa" ON public.user_profiles;
CREATE POLICY "Käyttäjät voivat nähdä omat tietonsa" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Käyttäjät voivat muokata omia tietojaan" ON public.user_profiles;
CREATE POLICY "Käyttäjät voivat muokata omia tietojaan" ON public.user_profiles
    FOR ALL USING (auth.uid() = id);

-- Julkinen haku (esim. vertailuun)
DROP POLICY IF EXISTS "Kaikki voivat nähdä julkiset profiilit" ON public.user_profiles;
CREATE POLICY "Kaikki voivat nähdä julkiset profiilit" ON public.user_profiles
    FOR SELECT USING (true);

