-- Eduskunta Mass Data Schema (MPs and Voting History)

-- 1. MPs Table
CREATE TABLE IF NOT EXISTS mps (
  id INTEGER PRIMARY KEY, -- personId
  first_name TEXT,
  last_name TEXT,
  party TEXT,
  constituency TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Voting Events Table
CREATE TABLE IF NOT EXISTS voting_events (
  id TEXT PRIMARY KEY, -- aanestysId
  title_fi TEXT,
  voting_date TIMESTAMP WITH TIME ZONE,
  he_id TEXT, -- heTunnus
  ayes INTEGER DEFAULT 0,
  noes INTEGER DEFAULT 0,
  blanks INTEGER DEFAULT 0,
  absent INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Individual MP Votes Table
CREATE TABLE IF NOT EXISTS mp_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mp_id INTEGER REFERENCES mps(id) ON DELETE CASCADE,
  event_id TEXT REFERENCES voting_events(id) ON DELETE CASCADE,
  vote_type TEXT CHECK (vote_type IN ('jaa', 'ei', 'tyhjaa', 'poissa')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(mp_id, event_id)
);

-- Enable RLS
ALTER TABLE mps ENABLE ROW LEVEL SECURITY;
ALTER TABLE voting_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read mps" ON mps FOR SELECT USING (TRUE);
CREATE POLICY "Public read voting_events" ON voting_events FOR SELECT USING (TRUE);
CREATE POLICY "Public read mp_votes" ON mp_votes FOR SELECT USING (TRUE);


