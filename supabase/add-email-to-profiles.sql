-- Add email column to profiles table for easier email sending
-- This allows us to send emails without needing Admin API access
-- Run this in your Supabase SQL Editor

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Update existing profiles with emails from auth.users
-- This is a one-time migration
UPDATE profiles p
SET email = (
  SELECT email 
  FROM auth.users u 
  WHERE u.id = p.id
)
WHERE email IS NULL;

-- Create a function to sync email from auth.users to profiles
CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET email = NEW.email
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-update email when auth.users.email changes
DROP TRIGGER IF EXISTS sync_profile_email_trigger ON auth.users;
CREATE TRIGGER sync_profile_email_trigger
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION sync_profile_email();

-- Also update on insert
CREATE OR REPLACE FUNCTION sync_profile_email_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET email = NEW.email
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_profile_email_on_insert_trigger ON auth.users;
CREATE TRIGGER sync_profile_email_on_insert_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_email_on_insert();



