-- Table for tracking Democratic DNA archetype points
CREATE TABLE IF NOT EXISTS user_archetypes (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    active_points INTEGER DEFAULT 0,
    fact_checker_points INTEGER DEFAULT 0,
    mediator_points INTEGER DEFAULT 0,
    reformer_points INTEGER DEFAULT 0,
    local_hero_points INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for badges/achievements
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_type TEXT NOT NULL, -- e.g. 'Sivistynyt kriitikko'
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, badge_type)
);

-- Enable RLS
ALTER TABLE user_archetypes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own archetypes" ON user_archetypes
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own badges" ON user_badges
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Function to initialize archetype on profile creation if needed
-- (Though we'll handle upsert in server actions for simplicity)

-- Add public_stance_enabled and current_archetype to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_archetype TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dna_level INTEGER DEFAULT 1;


