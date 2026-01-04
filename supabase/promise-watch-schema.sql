-- supabase/promise-watch-schema.sql

-- Create integrity alerts table
CREATE TABLE IF NOT EXISTS integrity_alerts (
  id BIGSERIAL PRIMARY KEY,
  mp_id INTEGER REFERENCES mps(id),
  event_id TEXT REFERENCES voting_events(id),
  category TEXT NOT NULL,
  promise_value INTEGER, -- 1-5 from vaalikone
  vote_type TEXT, -- jaa/ei
  deviation_score FLOAT, -- 0-1
  severity TEXT, -- 'low', 'medium', 'high'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(mp_id, event_id)
);

-- Add follows table if not exists (for notifications)
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  mp_id INTEGER REFERENCES mps(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, mp_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'alert',
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

