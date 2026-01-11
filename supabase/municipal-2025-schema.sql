-- 1. Kunnallisvaltuutettujen laajennettu taulu (2025 vaalit huomioiden)
CREATE TABLE IF NOT EXISTS public.councilors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    municipality TEXT NOT NULL,
    party TEXT,
    election_promises JSONB DEFAULT '{}',
    dna_fingerprint JSONB DEFAULT '{
        "economy": 0,
        "values": 0,
        "environment": 0,
        "regional": 0,
        "international": 0,
        "security": 0
    }',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(full_name, municipality)
);

-- 2. Kokousten ja pöytäkirjojen analyysi
CREATE TABLE IF NOT EXISTS public.meeting_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    municipality TEXT NOT NULL,
    meeting_title TEXT,
    meeting_date DATE,
    raw_content TEXT,
    external_url TEXT UNIQUE,
    ai_summary JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indeksit
CREATE INDEX IF NOT EXISTS idx_councilors_muni ON public.councilors(municipality);
CREATE INDEX IF NOT EXISTS idx_meeting_muni_date ON public.meeting_analysis(municipality, meeting_date);
