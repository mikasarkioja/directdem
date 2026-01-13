
-- Update mp_ai_profiles to support structured rhetoric data
-- We use to_jsonb to safely convert existing plain text values (like "Asiallinen") into valid JSON strings
ALTER TABLE public.mp_ai_profiles 
ALTER COLUMN rhetoric_style TYPE JSONB USING to_jsonb(rhetoric_style);

-- Add tracking for speech synchronization
ALTER TABLE public.mp_ai_profiles
ADD COLUMN IF NOT EXISTS last_speech_sync TIMESTAMP WITH TIME ZONE;

-- Add a column for specific debate persona instructions if needed
ALTER TABLE public.mp_ai_profiles
ADD COLUMN IF NOT EXISTS debate_instructions TEXT;

COMMENT ON COLUMN public.mp_ai_profiles.rhetoric_style IS 'Structured analysis of MP linguistic style, themes, and conflict patterns.';

