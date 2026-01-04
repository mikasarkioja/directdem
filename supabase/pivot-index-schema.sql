-- supabase/pivot-index-schema.sql

-- Create the table for raw candidate responses from vaalikone
CREATE TABLE IF NOT EXISTS mp_candidate_responses (
  id BIGSERIAL PRIMARY KEY,
  mp_id INTEGER REFERENCES mps(id),
  question TEXT NOT NULL,
  response_value INTEGER NOT NULL, -- 1-5
  category TEXT NOT NULL, -- Talous, Arvot, Ympäristö, etc.
  weight FLOAT DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(mp_id, question)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_mp_responses_mp_id ON mp_candidate_responses(mp_id);
CREATE INDEX IF NOT EXISTS idx_mp_responses_category ON mp_candidate_responses(category);

