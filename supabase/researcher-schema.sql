-- Table for historical election data and profile snapshots
CREATE TABLE IF NOT EXISTS public.historical_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mp_id INTEGER REFERENCES public.mps(id),
    election_year INTEGER NOT NULL,
    party TEXT,
    dna_snapshot JSONB, -- [economic, liberal, etc.]
    promises_snapshot JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table for Lobbying / Transparency Register data (Simplified for MVP)
CREATE TABLE IF NOT EXISTS public.lobbying_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mp_id INTEGER REFERENCES public.mps(id),
    organization_name TEXT NOT NULL,
    topic TEXT,
    meeting_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for researcher queries
CREATE INDEX IF NOT EXISTS idx_historical_mp ON public.historical_profiles(mp_id);
CREATE INDEX IF NOT EXISTS idx_lobbying_mp ON public.lobbying_activity(mp_id);
CREATE INDEX IF NOT EXISTS idx_lobbying_date ON public.lobbying_activity(meeting_date);

