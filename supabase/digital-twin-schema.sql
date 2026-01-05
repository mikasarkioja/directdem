-- Add shadow MP fields to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS committee_assignment TEXT,
ADD COLUMN IF NOT EXISTS rank_level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS shadow_id_url TEXT;

-- Create shadow_statements table for user opinions and amendments
CREATE TABLE IF NOT EXISTS shadow_statements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    bill_id UUID REFERENCES bills(id) ON DELETE CASCADE,
    statement_type TEXT CHECK (statement_type IN ('opinion', 'amendment')),
    content TEXT NOT NULL, -- The text of the opinion or the XML/Markdown of the amendment
    impact_points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create live_sessions table for real-time parliament tracking
CREATE TABLE IF NOT EXISTS live_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parliament_session_id TEXT UNIQUE,
    status TEXT CHECK (status IN ('active', 'ended', 'scheduled')),
    current_bill_id UUID REFERENCES bills(id),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Realtime for live_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE live_sessions;

