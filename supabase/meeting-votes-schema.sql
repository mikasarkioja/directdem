-- Taulu käyttäjien äänille kuntapäätöksistä
CREATE TABLE IF NOT EXISTS public.meeting_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES public.meeting_analysis(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    stance TEXT NOT NULL, -- FOR, AGAINST, NEUTRAL
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(meeting_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_meeting_votes_meeting ON public.meeting_votes(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_votes_user ON public.meeting_votes(user_id);

