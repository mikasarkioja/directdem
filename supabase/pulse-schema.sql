-- Table for tracking user votes on Pulse questions
CREATE TABLE IF NOT EXISTS public.user_pulse_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    stance TEXT NOT NULL CHECK (stance IN ('YES', 'NO')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, question_id)
);

-- RLS Policies
ALTER TABLE public.user_pulse_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pulse votes"
    ON public.user_pulse_votes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pulse votes"
    ON public.user_pulse_votes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pulse votes"
    ON public.user_pulse_votes FOR UPDATE
    USING (auth.uid() = user_id);

