-- Manifesto Evolution and Learning Engine

-- 1. Table for manifesto version history
CREATE TABLE IF NOT EXISTS manifesto_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID REFERENCES virtual_parties(id) ON DELETE CASCADE,
  manifesto_text TEXT NOT NULL,
  reasoning TEXT, -- AI reasoning for the update
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  version_number INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT FALSE
);

-- 2. Add pending update fields to virtual_parties
ALTER TABLE virtual_parties 
ADD COLUMN IF NOT EXISTS pending_update_text TEXT,
ADD COLUMN IF NOT EXISTS pending_update_reasoning TEXT,
ADD COLUMN IF NOT EXISTS pending_update_created_at TIMESTAMP WITH TIME ZONE;

-- 3. Table for voting on manifesto updates
CREATE TABLE IF NOT EXISTS manifesto_update_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID REFERENCES virtual_parties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  approve BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(party_id, user_id)
);

-- Enable RLS
ALTER TABLE manifesto_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE manifesto_update_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read manifesto versions" ON manifesto_versions FOR SELECT USING (TRUE);
CREATE POLICY "Members can vote on updates" ON manifesto_update_votes FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM party_members 
    WHERE party_id = manifesto_update_votes.party_id 
    AND user_id = auth.uid()
  )
);
CREATE POLICY "Members can see votes" ON manifesto_update_votes FOR SELECT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM party_members 
    WHERE party_id = manifesto_update_votes.party_id 
    AND user_id = auth.uid()
  )
);

