-- Committee Workspace Schema

-- Tasks for collaborative bill analysis
CREATE TABLE IF NOT EXISTS bill_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bill_id UUID REFERENCES bills(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK (status IN ('todo', 'in_progress', 'completed')) DEFAULT 'todo',
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Clause-level amendments/edits
CREATE TABLE IF NOT EXISTS bill_amendments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bill_id UUID REFERENCES bills(id) ON DELETE CASCADE,
    section_title TEXT, -- e.g., "1 §", "Pykälä 5"
    original_text TEXT,
    proposed_text TEXT NOT NULL,
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    votes_for INTEGER DEFAULT 0,
    votes_against INTEGER DEFAULT 0,
    status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Votes for amendments to track unique users
CREATE TABLE IF NOT EXISTS amendment_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    amendment_id UUID REFERENCES bill_amendments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    vote_type TEXT CHECK (vote_type IN ('pro', 'con')),
    UNIQUE(amendment_id, user_id)
);

-- Enable Realtime for collaboration
ALTER PUBLICATION supabase_realtime ADD TABLE bill_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE bill_amendments;
ALTER PUBLICATION supabase_realtime ADD TABLE amendment_votes;

