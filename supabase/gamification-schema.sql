-- Gamification Schema for Civic Command Center

-- Add gamification fields to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS impact_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS voting_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS public_stance BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- Table for user predictions
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  bill_id UUID REFERENCES bills(id) ON DELETE CASCADE,
  municipal_case_id UUID REFERENCES municipal_cases(id) ON DELETE CASCADE,
  predicted_outcome TEXT NOT NULL, -- 'passed', 'rejected'
  is_correct BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, bill_id),
  UNIQUE(user_id, municipal_case_id)
);

-- Enable RLS on predictions
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own predictions" 
ON predictions FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own predictions" 
ON predictions FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Table for achievements
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  xp_reward INTEGER DEFAULT 0
);

-- User achievements join table
CREATE TABLE IF NOT EXISTS user_achievements (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

-- Enable RLS on achievements
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access to achievements" ON achievements FOR SELECT USING (TRUE);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own achievements" 
ON user_achievements FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Insert some default achievements
INSERT INTO achievements (name, description, icon, xp_reward) VALUES
('Ensimmäinen ääni', 'Annoit ensimmäisen äänesi yhteiskunnalliseen asiaan.', 'vote-icon', 100),
('Ennustaja', 'Teit ensimmäisen ennustuksesi päätöksenteosta.', 'crystal-ball', 150),
('Kuntavahti', 'Äänestit kolmessa paikallisessa asiassa.', 'building-icon', 200),
('Siviili-identiteetti', 'Vahvistit henkilöllisyytesi.', 'shield-check', 500);


