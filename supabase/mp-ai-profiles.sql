-- Create MP AI Profiles table
CREATE TABLE IF NOT EXISTS mp_ai_profiles (
    mp_id TEXT PRIMARY KEY REFERENCES mps(id) ON DELETE CASCADE,
    voting_summary JSONB DEFAULT '{}',
    promise_data JSONB DEFAULT '{}',
    rhetoric_style TEXT,
    system_prompt TEXT,
    conflicts JSONB DEFAULT '[]',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE mp_ai_profiles ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to mp_ai_profiles" 
ON mp_ai_profiles FOR SELECT 
TO public 
USING (true);

