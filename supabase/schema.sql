-- DirectDem Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Bills table
-- Stores legislative bills from Eduskunta API
CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parliament_id TEXT UNIQUE NOT NULL, -- e.g., "HE 123/2024"
  title TEXT NOT NULL,
  summary TEXT,
  raw_text TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'in_progress', 'voting', 'passed', 'rejected')),
  category TEXT,
  published_date TIMESTAMPTZ,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Votes table
-- Stores user votes on bills
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position TEXT NOT NULL CHECK (position IN ('for', 'against', 'neutral')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(bill_id, user_id) -- One vote per user per bill
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_votes_bill_id ON votes(bill_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_parliament_id ON bills(parliament_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON bills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_votes_updated_at BEFORE UPDATE ON votes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Bills: Everyone can read, server-side operations can write
CREATE POLICY "Bills are viewable by everyone"
  ON bills FOR SELECT
  USING (true);

-- Allow inserts for server-side sync operations
-- In production, you might want to restrict this further
CREATE POLICY "Allow bill inserts for sync"
  ON bills FOR INSERT
  WITH CHECK (true);

-- Allow updates for server-side sync operations
CREATE POLICY "Allow bill updates for sync"
  ON bills FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Votes: Users can only see their own votes, but aggregate results are visible
CREATE POLICY "Users can view their own votes"
  ON votes FOR SELECT
  USING (auth.uid() = user_id);

-- Votes: Users can insert their own votes
CREATE POLICY "Users can insert their own votes"
  ON votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Votes: Users can update their own votes
CREATE POLICY "Users can update their own votes"
  ON votes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Votes: Users can delete their own votes
CREATE POLICY "Users can delete their own votes"
  ON votes FOR DELETE
  USING (auth.uid() = user_id);

-- Function to get aggregate vote statistics (public, no RLS needed)
CREATE OR REPLACE FUNCTION get_vote_stats(bill_uuid UUID)
RETURNS TABLE (
  for_count BIGINT,
  against_count BIGINT,
  neutral_count BIGINT,
  total_count BIGINT,
  for_percent NUMERIC,
  against_percent NUMERIC,
  neutral_percent NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE position = 'for')::BIGINT as for_count,
    COUNT(*) FILTER (WHERE position = 'against')::BIGINT as against_count,
    COUNT(*) FILTER (WHERE position = 'neutral')::BIGINT as neutral_count,
    COUNT(*)::BIGINT as total_count,
    CASE 
      WHEN COUNT(*) > 0 THEN ROUND(100.0 * COUNT(*) FILTER (WHERE position = 'for') / COUNT(*), 1)
      ELSE 0
    END as for_percent,
    CASE 
      WHEN COUNT(*) > 0 THEN ROUND(100.0 * COUNT(*) FILTER (WHERE position = 'against') / COUNT(*), 1)
      ELSE 0
    END as against_percent,
    CASE 
      WHEN COUNT(*) > 0 THEN ROUND(100.0 * COUNT(*) FILTER (WHERE position = 'neutral') / COUNT(*), 1)
      ELSE 0
    END as neutral_percent
  FROM votes
  WHERE bill_id = bill_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_vote_stats(UUID) TO anon, authenticated;

-- Create a view for public vote aggregates (readable by everyone)
CREATE OR REPLACE VIEW vote_aggregates AS
SELECT
  bill_id,
  COUNT(*) FILTER (WHERE position = 'for') as for_count,
  COUNT(*) FILTER (WHERE position = 'against') as against_count,
  COUNT(*) FILTER (WHERE position = 'neutral') as neutral_count,
  COUNT(*) as total_count,
  CASE 
    WHEN COUNT(*) > 0 THEN ROUND(100.0 * COUNT(*) FILTER (WHERE position = 'for') / COUNT(*), 1)
    ELSE 0
  END as for_percent,
  CASE 
    WHEN COUNT(*) > 0 THEN ROUND(100.0 * COUNT(*) FILTER (WHERE position = 'against') / COUNT(*), 1)
    ELSE 0
  END as against_percent,
  CASE 
    WHEN COUNT(*) > 0 THEN ROUND(100.0 * COUNT(*) FILTER (WHERE position = 'neutral') / COUNT(*), 1)
    ELSE 0
  END as neutral_percent
FROM votes
GROUP BY bill_id;

-- Grant select on the view to everyone
GRANT SELECT ON vote_aggregates TO anon, authenticated;

