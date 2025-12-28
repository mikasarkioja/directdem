# Quick Fix: RLS Policy Error

## The Problem

You're getting this error:
```
new row violates row-level security policy for table "bills"
```

This happens because Row Level Security (RLS) is enabled on the `bills` table, but there's no policy allowing inserts.

## The Solution

Run this SQL in your Supabase SQL Editor:

1. Go to your Supabase Dashboard
2. Click **SQL Editor**
3. Click **New query**
4. Copy and paste the SQL below
5. Click **Run**

```sql
-- Add INSERT and UPDATE policies for bills table

-- Allow inserts for server-side sync operations
CREATE POLICY "Allow bill inserts for sync"
  ON bills FOR INSERT
  WITH CHECK (true);

-- Allow updates for server-side sync operations  
CREATE POLICY "Allow bill updates for sync"
  ON bills FOR UPDATE
  USING (true)
  WITH CHECK (true);
```

## Alternative: Run the Complete Fix

Or run the complete fix file:

1. Open `supabase/fix-rls-policies.sql` from this project
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Run it

This will:
- Drop existing policies (if any)
- Recreate all policies correctly
- Allow inserts and updates for syncing

## After Running

1. Go back to your app
2. Click "Sync from API" again
3. It should work now! ✅

## Security Note

The policies allow inserts/updates from anyone. For production, you might want to restrict this to:
- Only authenticated users
- Or use a service role key for server-side operations
- Or create a SECURITY DEFINER function

For MVP/demo purposes, the current setup is fine.

