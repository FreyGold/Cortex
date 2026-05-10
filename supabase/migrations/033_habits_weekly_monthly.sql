-- Migration 033: Habits — Weekly + Monthly frequency with user-configurable days
-- 1. Rename custom_days → week_days (TEXT[] of day names like "Monday")
-- 2. Add month_days (TEXT[] of day-of-month numbers like "1", "21")
-- 3. Update frequency CHECK: Daily | Weekly | Monthly
-- 4. Update RLS comment on daily_tasks

-- ── Step 1: Replace custom_days with week_days ──────────────────
ALTER TABLE public.habits
  DROP COLUMN IF EXISTS custom_days;

ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS week_days TEXT[] DEFAULT '{}'
  NOT NULL;

COMMENT ON COLUMN public.habits.week_days IS
  'Array of day names for Weekly frequency, e.g. ["Monday","Wednesday","Friday"]';

-- ── Step 2: month_days for Monthly frequency ────────────────────
ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS month_days TEXT[] DEFAULT '{}'
  NOT NULL;

COMMENT ON COLUMN public.habits.month_days IS
  'Array of day-of-month numbers for Monthly frequency, e.g. ["1","15","21"]';

-- ── Step 3: Update frequency CHECK ──────────────────────────────
ALTER TABLE public.habits
  DROP CONSTRAINT IF EXISTS habits_frequency_check;

ALTER TABLE public.habits
  ADD CONSTRAINT habits_frequency_check
  CHECK (frequency IN ('Daily', 'Weekly', 'Monthly'));