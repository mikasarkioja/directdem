-- Fix RLS Policies for Bills Table
-- Run this in your Supabase SQL Editor if you're getting RLS errors

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Bills are viewable by everyone" ON bills;
DROP POLICY IF EXISTS "Allow bill inserts for sync" ON bills;
DROP POLICY IF EXISTS "Allow bill updates for sync" ON bills;

-- Bills: Everyone can read
CREATE POLICY "Bills are viewable by everyone"
  ON bills FOR SELECT
  USING (true);

-- Allow inserts for server-side sync operations
-- This allows the sync function to insert bills from Eduskunta API
CREATE POLICY "Allow bill inserts for sync"
  ON bills FOR INSERT
  WITH CHECK (true);

-- Allow updates for server-side sync operations
-- This allows updating existing bills when syncing
CREATE POLICY "Allow bill updates for sync"
  ON bills FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'bills';

