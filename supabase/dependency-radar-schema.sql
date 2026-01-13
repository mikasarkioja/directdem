-- Dependency Radar Schema
-- Tables to store MP dependencies and lobbyist meetings

-- MP Dependencies (Hallituspaikat, osakeomistukset jne)
CREATE TABLE IF NOT EXISTS public.mp_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mp_id INTEGER REFERENCES public.mps(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- e.g. "Hallitustyöskentely", "Osakeomistus", "Muu tulonlähde"
    description TEXT NOT NULL,
    organization TEXT,
    value_description TEXT,
    declared_at DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(mp_id, description)
);

-- Lobbyist Meetings (already partially added to mp_ai_profiles, but let's make it a table for better scale)
CREATE TABLE IF NOT EXISTS public.lobbyist_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mp_id INTEGER REFERENCES public.mps(id) ON DELETE CASCADE,
    bill_id UUID REFERENCES public.bills(id) ON DELETE SET NULL, -- Optional link to a specific bill
    lobbyist_name TEXT NOT NULL,
    organization TEXT NOT NULL,
    topic TEXT NOT NULL,
    meeting_date DATE NOT NULL,
    is_committee_lead BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(mp_id, organization, meeting_date)
);

-- Update mp_ai_profiles to include a cache for conflict scores
ALTER TABLE public.mp_ai_profiles 
ADD COLUMN IF NOT EXISTS last_conflict_analysis JSONB DEFAULT '{}';

COMMENT ON TABLE public.mp_dependencies IS 'MP financial interests and board memberships.';
COMMENT ON TABLE public.lobbyist_meetings IS 'Lobbyist meetings from the Transparency Register.';

