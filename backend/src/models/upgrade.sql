-- Brings a database that already has the tables up to schema.sql. Safe to run any number of times.
-- Run by scripts/migrate.js. Add new steps at the end, each one repeatable.

-- ---------- resources.support_group (required, no default) ----------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'support_group' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE support_group AS ENUM ('crisis', 'university', 'faculty', 'clinic', 'self_help');
  END IF;
END $$;

ALTER TABLE resources ADD COLUMN IF NOT EXISTS support_group support_group;

-- Existing rows get a close guess until db:seed-safety writes each resource's real group.
-- This matters for safety: the Crisis page shows only the 'crisis' group.
UPDATE resources SET support_group = (CASE
    WHEN type = 'crisis' THEN 'crisis'
    WHEN faculty IS NOT NULL THEN 'faculty'
    WHEN type = 'counselling' THEN 'university'
    ELSE 'self_help'
  END)::support_group
 WHERE support_group IS NULL;

-- A missing group must fail instead of quietly becoming self-help.
ALTER TABLE resources
  ALTER COLUMN support_group DROP DEFAULT,
  ALTER COLUMN support_group SET NOT NULL;

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
