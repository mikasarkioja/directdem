-- Update votes table to allow NULL user_id for anonymization
-- Run this in your Supabase SQL Editor

-- Remove NOT NULL constraint from user_id (if it exists)
-- This allows anonymizing votes by setting user_id to NULL
ALTER TABLE votes 
  ALTER COLUMN user_id DROP NOT NULL;

-- Update foreign key constraint to allow NULL
-- Note: This might require dropping and recreating the constraint
-- Check if constraint exists first
DO $$ 
BEGIN
  -- Drop existing foreign key if it doesn't allow NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'votes_user_id_fkey'
  ) THEN
    ALTER TABLE votes DROP CONSTRAINT votes_user_id_fkey;
  END IF;
END $$;

-- Recreate foreign key that allows NULL
ALTER TABLE votes
  ADD CONSTRAINT votes_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE SET NULL;

-- Update unique constraint to allow multiple NULL votes per bill
-- (since NULL != NULL in SQL, we need a partial unique index)
DROP INDEX IF EXISTS votes_bill_id_user_id_unique;
CREATE UNIQUE INDEX votes_bill_id_user_id_unique 
  ON votes(bill_id, user_id) 
  WHERE user_id IS NOT NULL;

-- For anonymized votes (user_id IS NULL), we can have multiple per bill
-- This is intentional - they're anonymous contributions to statistics


