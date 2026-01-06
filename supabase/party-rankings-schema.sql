-- supabase/party-rankings-schema.sql
-- Table to store pre-calculated party-level metrics for the Political Power Rankings module

CREATE TABLE IF NOT EXISTS party_rankings (
    id SERIAL PRIMARY KEY,
    party_name TEXT UNIQUE NOT NULL,
    cohesion_score FLOAT DEFAULT 0, -- Rice Index (0-100)
    polarization_score FLOAT DEFAULT 0, -- Distance from median
    polarization_vector JSONB, -- Directional deviation across 6 axes
    pivot_score FLOAT DEFAULT 0, -- Deviation from election promises (0-100)
    activity_score FLOAT DEFAULT 0, -- Average votes per MP
    mp_count INTEGER DEFAULT 0,
    topic_ownership JSONB, -- Map of { category: intensity }
    top_category TEXT, -- The category with highest ownership intensity
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_party_rankings_party_name ON party_rankings(party_name);

