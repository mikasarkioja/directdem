-- Table for MP activity stream (speeches, questions, etc.)
CREATE TABLE IF NOT EXISTS public.mp_activity_stream (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mp_id TEXT NOT NULL, -- Eduskunta HenkiloId
    activity_type TEXT NOT NULL, -- 'speech', 'question', 'vote'
    external_id TEXT UNIQUE, -- SaliPuheId or KirjallinenKysymysId
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    content_summary TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add activity_index to mp_profiles if not exists
ALTER TABLE public.mp_profiles ADD COLUMN IF NOT EXISTS activity_index INTEGER DEFAULT 0;

-- Table for lobbying data (simulated for now)
CREATE TABLE IF NOT EXISTS public.mp_lobbying_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mp_id TEXT NOT NULL,
    organization_name TEXT NOT NULL,
    meeting_date DATE NOT NULL,
    topic TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_mp_activity_mp_id ON public.mp_activity_stream(mp_id);
CREATE INDEX IF NOT EXISTS idx_mp_activity_date ON public.mp_activity_stream(date DESC);
CREATE INDEX IF NOT EXISTS idx_mp_lobbying_mp_id ON public.mp_lobbying_data(mp_id);

