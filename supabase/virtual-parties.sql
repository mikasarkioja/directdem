-- Virtual Parties (Factions) Table
CREATE TABLE IF NOT EXISTS virtual_parties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    manifesto TEXT,
    logo_url TEXT,
    created_by UUID REFERENCES auth.users(id),
    total_xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    dna_profile_avg JSONB DEFAULT '{}'::jsonb, -- Stores the average DNA archetype points of members
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Party Membership Table
CREATE TABLE IF NOT EXISTS party_members (
    party_id UUID REFERENCES virtual_parties(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('founder', 'member')) DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (party_id, user_id)
);

-- Party Stances on Issues
-- This table stores how the virtual party as a whole stands on specific bills/cases
CREATE TABLE IF NOT EXISTS party_stances (
    party_id UUID REFERENCES virtual_parties(id) ON DELETE CASCADE,
    bill_id UUID REFERENCES bills(id) ON DELETE CASCADE,
    municipal_case_id UUID REFERENCES municipal_cases(id) ON DELETE CASCADE,
    position TEXT CHECK (position IN ('for', 'against', 'neutral')),
    consensus_score FLOAT DEFAULT 0, -- 0-1, how unified the party is
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (party_id),
    CONSTRAINT one_issue_per_stance CHECK (
        (bill_id IS NOT NULL AND municipal_case_id IS NULL) OR 
        (bill_id IS NULL AND municipal_case_id IS NOT NULL)
    )
);

-- Enable RLS
ALTER TABLE virtual_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_stances ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read access for parties" ON virtual_parties FOR SELECT USING (true);
CREATE POLICY "Public read access for members" ON party_members FOR SELECT USING (true);
CREATE POLICY "Public read access for stances" ON party_stances FOR SELECT USING (true);

-- Authenticated users can create parties
CREATE POLICY "Authenticated users can create parties" ON virtual_parties FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- Founders can update their party
CREATE POLICY "Founders can update their party" ON virtual_parties FOR UPDATE TO authenticated 
    USING (EXISTS (SELECT 1 FROM party_members WHERE party_id = virtual_parties.id AND user_id = auth.uid() AND role = 'founder'));

-- Users can join parties
CREATE POLICY "Users can join parties" ON party_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

