-- Table for Transparency Register meeting data
CREATE TABLE IF NOT EXISTS public.lobbyist_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name TEXT NOT NULL,
    mp_id INTEGER REFERENCES public.mps(id),
    mp_name TEXT, -- Fallback if mp_id is not linked
    meeting_date DATE NOT NULL,
    topic_description TEXT,
    bill_id UUID REFERENCES public.bills(id),
    parliament_id TEXT, -- e.g. HE 123/2025
    is_committee_lead BOOLEAN DEFAULT false, -- If the MP is Chair/Vice-chair
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for lookup
CREATE INDEX IF NOT EXISTS idx_meeting_org ON public.lobbyist_meetings(organization_name);
CREATE INDEX IF NOT EXISTS idx_meeting_bill ON public.lobbyist_meetings(bill_id);
CREATE INDEX IF NOT EXISTS idx_meeting_date ON public.lobbyist_meetings(meeting_date);

