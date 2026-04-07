-- Add admin flag for /admin and newsletter RLS. Run once in Supabase SQL Editor.
-- Safe on existing DBs (IF NOT EXISTS).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles (is_admin);
