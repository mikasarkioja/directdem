-- =============================================================================
-- Task 1 — Export live public schema for comparison with local supabase/*.sql
-- Run in Supabase → SQL Editor. Copy full result set(s) back to your IDE.
-- =============================================================================

-- A) Tables + columns + types (main comparison feed)
SELECT
  c.table_name,
  c.ordinal_position AS pos,
  c.column_name,
  c.data_type,
  c.udt_name,
  c.character_maximum_length AS char_len,
  c.numeric_precision,
  c.numeric_scale,
  c.is_nullable,
  c.column_default
FROM information_schema.columns c
WHERE c.table_schema = 'public'
ORDER BY c.table_name, c.ordinal_position;

-- B) Constraints / PKs (run as second query if you prefer smaller exports)
-- SELECT
--   tc.table_name,
--   tc.constraint_type,
--   kcu.column_name,
--   ccu.table_name AS foreign_table_name,
--   ccu.column_name AS foreign_column_name
-- FROM information_schema.table_constraints tc
-- JOIN information_schema.key_column_usage kcu
--   ON tc.constraint_name = kcu.constraint_name
--   AND tc.table_schema = kcu.table_schema
-- LEFT JOIN information_schema.constraint_column_usage ccu
--   ON ccu.constraint_name = tc.constraint_name
--   AND ccu.table_schema = tc.table_schema
-- WHERE tc.table_schema = 'public'
-- ORDER BY tc.table_name, tc.constraint_type, kcu.ordinal_position;

-- C) RLS: enabled + policies
SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_force
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
ORDER BY c.relname;

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
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
