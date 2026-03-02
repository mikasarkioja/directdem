-- Add researcher fields to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS researcher_type TEXT,
ADD COLUMN IF NOT EXISTS researcher_focus TEXT[],
ADD COLUMN IF NOT EXISTS researcher_initialized BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS active_role TEXT DEFAULT 'citizen',
ADD COLUMN IF NOT EXISTS xp BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Update RLS if needed (already broad enough)
