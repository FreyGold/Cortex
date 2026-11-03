-- Migration 034: Fix habits schema for Weekly/Monthly
-- 1. Update frequency CHECK constraint to include Weekly and Monthly
-- 2. Drop custom_days if still exists, add week_days and month_days columns

-- ── Step 1: Update frequency CHECK ─────────────────────────────────
ALTER TABLE public.habits
  DROP CONSTRAINT IF EXISTS habits_frequency_check;

ALTER TABLE public.habits
  ADD CONSTRAINT habits_frequency_check
  CHECK (frequency IN ('Daily', 'Weekly', 'Monthly'));

-- ── Step 2: Remove old custom_days, add week_days + month_days ───────
DO $$
BEGIN
  -- Drop custom_days if it exists (from migration 032)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'habits' AND column_name = 'custom_days'
  ) THEN
    ALTER TABLE public.habits DROP COLUMN IF EXISTS custom_days;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- ignore if custom_days already gone
END $$;

ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS week_days TEXT[] DEFAULT '{}' NOT NULL;

ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS month_days TEXT[] DEFAULT '{}' NOT NULL;