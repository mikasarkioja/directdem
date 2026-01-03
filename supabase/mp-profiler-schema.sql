-- MP Profiler Schema

-- 1. Table for MP Profiles
CREATE TABLE IF NOT EXISTS mp_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parliament_id INTEGER UNIQUE NOT NULL, -- MP's ID in Eduskunta API
  full_name TEXT NOT NULL,
  party TEXT NOT NULL,
  dna_economy FLOAT DEFAULT 0, -- -1 (State) to 1 (Market)
  dna_values FLOAT DEFAULT 0,  -- -1 (Conservative) to 1 (Liberal)
  dna_environment FLOAT DEFAULT 0, -- -1 (Utilization) to 1 (Protection)
  vote_count INTEGER DEFAULT 0,
  last_analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb -- Stores party alignment, specific category scores
);

-- 2. Index for vector search simulation (distance calculation)
CREATE INDEX IF NOT EXISTS idx_mp_profiles_dna ON mp_profiles (dna_economy, dna_values, dna_environment);

-- Enable RLS
ALTER TABLE mp_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read mp profiles" ON mp_profiles FOR SELECT USING (TRUE);

