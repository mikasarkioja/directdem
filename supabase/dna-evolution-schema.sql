-- DNA Evolution History Table
CREATE TABLE IF NOT EXISTS user_profile_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  scores_json JSONB NOT NULL, -- { economic, liberal, env, urban, global, security }
  archetype TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_user_profile_history_user_id ON user_profile_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profile_history_created_at ON user_profile_history(created_at);

-- RLS Policies
ALTER TABLE user_profile_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own history" 
ON user_profile_history FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System/Users can insert their own history" 
ON user_profile_history FOR INSERT 
WITH CHECK (auth.uid() = user_id);

