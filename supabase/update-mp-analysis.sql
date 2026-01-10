-- Update voting_events and mp_profiles to support AI analysis
ALTER TABLE voting_events ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE voting_events ADD COLUMN IF NOT EXISTS summary_ai TEXT;

-- Adjust mp_profiles to match the script's expected columns if they differ, 
-- or create the table if it doesn't exist with the script's names.
-- Looking at the script, it uses:
-- mp_id, economic_score, liberal_conservative_score, environmental_score, total_votes_analyzed

CREATE TABLE IF NOT EXISTS mp_profiles_new (
  mp_id INTEGER PRIMARY KEY REFERENCES mps(id) ON DELETE CASCADE,
  economic_score FLOAT DEFAULT 0,
  liberal_conservative_score FLOAT DEFAULT 0,
  environmental_score FLOAT DEFAULT 0,
  total_votes_analyzed INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If mp_profiles already exists with different names, we might want to unify them.
-- But for now, let's just make sure the columns the script needs exist.
-- The script uses: await supabase.from('mp_profiles').upsert(...)
-- So I will ensure mp_profiles has those columns.

ALTER TABLE mp_profiles ADD COLUMN IF NOT EXISTS mp_id INTEGER REFERENCES mps(id);
ALTER TABLE mp_profiles ADD COLUMN IF NOT EXISTS economic_score FLOAT DEFAULT 0;
ALTER TABLE mp_profiles ADD COLUMN IF NOT EXISTS liberal_conservative_score FLOAT DEFAULT 0;
ALTER TABLE mp_profiles ADD COLUMN IF NOT EXISTS environmental_score FLOAT DEFAULT 0;
ALTER TABLE mp_profiles ADD COLUMN IF NOT EXISTS total_votes_analyzed INTEGER DEFAULT 0;
ALTER TABLE mp_profiles ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();


