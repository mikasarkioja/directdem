-- Create Bill AI Profiles table
CREATE TABLE IF NOT EXISTS bill_ai_profiles (
    bill_id TEXT PRIMARY KEY REFERENCES bills(id) ON DELETE CASCADE,
    hotspots JSONB DEFAULT '[]', -- { "title": "", "text": "", "pro_con": "", "relevance": 0-1 }
    audience_hook TEXT,
    dna_impact JSONB DEFAULT '{}', -- { "economic": 0.5, "liberal": 0.2, ... }
    controversy_score FLOAT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE bill_ai_profiles ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to bill_ai_profiles" 
ON bill_ai_profiles FOR SELECT 
TO public 
USING (true);

