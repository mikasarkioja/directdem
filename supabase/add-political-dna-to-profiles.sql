-- Add political DNA scores to user profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS economic_score FLOAT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS liberal_conservative_score FLOAT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS environmental_score FLOAT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS initialized_from_mp TEXT;


