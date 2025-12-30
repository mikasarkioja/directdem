-- Add join_report_list column to profiles table
-- Run this in your Supabase SQL Editor

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS join_report_list BOOLEAN DEFAULT false;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_join_report_list ON profiles(join_report_list);

-- Update comment
COMMENT ON COLUMN profiles.join_report_list IS 'User has opted in to weekly anonymous voting reports sent to parliament';

