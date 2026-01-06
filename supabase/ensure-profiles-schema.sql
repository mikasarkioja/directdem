-- Varmistetaan että profiles-taulu on kunnossa ja sisältää kaikki tarvittavat kentät
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    email TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    vaalipiiri TEXT,
    municipality TEXT,
    last_login TIMESTAMPTZ,
    join_report_list BOOLEAN DEFAULT FALSE,
    impact_points INTEGER DEFAULT 0,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    economic_score FLOAT DEFAULT 0,
    liberal_conservative_score FLOAT DEFAULT 0,
    environmental_score FLOAT DEFAULT 0,
    urban_rural_score FLOAT DEFAULT 0,
    international_national_score FLOAT DEFAULT 0,
    security_score FLOAT DEFAULT 0,
    initialized_from_mp INTEGER,
    trust_score INTEGER DEFAULT 50,
    organization_tag TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Varmistetaan RLS-säännöt (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view own profile') THEN
        CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Public profiles are viewable by everyone') THEN
        CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
    END IF;
END $$;

