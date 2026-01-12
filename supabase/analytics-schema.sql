-- Feature usage tracking
CREATE TABLE IF NOT EXISTS public.feature_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    feature_name TEXT NOT NULL, -- e.g. 'Arena Duel', 'Vote', 'Bill Analysis'
    action_type TEXT NOT NULL, -- e.g. 'CLICK', 'SUBMIT', 'GENERATE'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI Cost and Usage tracking
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    feature_context TEXT NOT NULL,
    model_name TEXT NOT NULL,
    input_tokens INTEGER NOT NULL,
    output_tokens INTEGER NOT NULL,
    cost_usd FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS: Only admins can see these logs
ALTER TABLE public.feature_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Note: In a production app, we would have a 'roles' check. 
-- For now, we assume service role or explicit admin check in code.
CREATE POLICY "Admins can read all feature logs" 
ON public.feature_usage_logs FOR SELECT 
USING (auth.jwt() ->> 'email' LIKE '%admin%'); -- Simple placeholder check

CREATE POLICY "Admins can read all ai logs" 
ON public.ai_usage_logs FOR SELECT 
USING (auth.jwt() ->> 'email' LIKE '%admin%');

