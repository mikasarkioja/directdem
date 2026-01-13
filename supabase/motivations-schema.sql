-- Add hidden motivations and regional focus to mp_ai_profiles
ALTER TABLE public.mp_ai_profiles
ADD COLUMN IF NOT EXISTS lobbyist_meetings JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS affiliations JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS current_sentiment TEXT,
ADD COLUMN IF NOT EXISTS regional_bias TEXT;

-- Add hometown to mps
ALTER TABLE public.mps
ADD COLUMN IF NOT EXISTS hometown TEXT;

COMMENT ON COLUMN public.mp_ai_profiles.lobbyist_meetings IS 'Latest lobbyist meetings from Transparency Register.';
COMMENT ON COLUMN public.mp_ai_profiles.affiliations IS 'MP affiliations like board seats and financial interests.';
COMMENT ON COLUMN public.mp_ai_profiles.current_sentiment IS 'Current public sentiment or mood based on recent social media activity.';
COMMENT ON COLUMN public.mp_ai_profiles.regional_bias IS 'Instructions for favoring arguments beneficial to the MP constituency/hometown.';

