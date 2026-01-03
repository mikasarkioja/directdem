-- Municipal cases table
CREATE TABLE IF NOT EXISTS municipal_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  municipality TEXT NOT NULL, -- e.g. 'Espoo'
  external_id TEXT NOT NULL, -- ID from the city's API
  title TEXT NOT NULL,
  summary TEXT,
  raw_text TEXT,
  status TEXT, -- 'agenda', 'decided', etc.
  meeting_date TIMESTAMP WITH TIME ZONE,
  org_name TEXT, -- e.g. 'Kaupunginhallitus'
  neighborhood TEXT, -- extracted by AI
  cost_estimate NUMERIC, -- extracted by AI
  category TEXT,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(municipality, external_id)
);

-- Enable RLS on municipal_cases
ALTER TABLE municipal_cases ENABLE ROW LEVEL SECURITY;

-- Allow public read access to cases
CREATE POLICY "Allow public read access to municipal_cases" 
ON municipal_cases FOR SELECT 
TO public 
USING (true);

-- Allow everyone to insert/update cases (for sync-on-demand)
-- Note: In production this should be restricted to service_role or admin
CREATE POLICY "Allow anyone to insert municipal_cases" 
ON municipal_cases FOR INSERT 
TO public
WITH CHECK (true);

CREATE POLICY "Allow anyone to update municipal_cases" 
ON municipal_cases FOR UPDATE 
TO public
USING (true)
WITH CHECK (true);

-- Municipal votes table
CREATE TABLE IF NOT EXISTS municipal_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES municipal_cases(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  position TEXT CHECK (position IN ('for', 'against', 'neutral')),
  is_resident BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(case_id, user_id)
);

-- Enable RLS on municipal_votes
ALTER TABLE municipal_votes ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own votes
CREATE POLICY "Users can view their own municipal votes" 
ON municipal_votes FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Allow authenticated users to insert/update their own votes
CREATE POLICY "Users can insert/update their own municipal votes" 
ON municipal_votes FOR ALL 
TO authenticated 
USING (auth.uid() = user_id);

-- Add municipality to profiles if not exists
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'municipality') THEN
    ALTER TABLE profiles ADD COLUMN municipality TEXT;
  END IF;
END $$;

