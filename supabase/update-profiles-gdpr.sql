-- Update profiles table to add GDPR consent fields
-- Run this in your Supabase SQL Editor

-- Add GDPR consent fields if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'gdpr_consent'
  ) THEN
    ALTER TABLE profiles ADD COLUMN gdpr_consent BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'gdpr_consent_date'
  ) THEN
    ALTER TABLE profiles ADD COLUMN gdpr_consent_date TIMESTAMPTZ;
  END IF;
END $$;

-- Update existing accepted_terms to gdpr_consent if needed
UPDATE profiles 
SET gdpr_consent = accepted_terms,
    gdpr_consent_date = terms_accepted_at
WHERE accepted_terms = true AND gdpr_consent = false;

