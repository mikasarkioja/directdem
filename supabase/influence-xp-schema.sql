-- Add XP and Level to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS xp INT8 DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INT4 DEFAULT 1;

-- Create user_actions_log table
CREATE TABLE IF NOT EXISTS public.user_actions_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    xp_earned INT4 NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user_actions_log
ALTER TABLE public.user_actions_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own action logs
CREATE POLICY "Users can view own action logs"
    ON public.user_actions_log FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Grants
GRANT SELECT, INSERT ON public.user_actions_log TO authenticated;


