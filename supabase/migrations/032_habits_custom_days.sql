-- Migration 032: Habits — custom_days + task linking
-- 1. Add custom_days (TEXT[]) to habits for custom frequency
-- 2. Add habit_id (UUID FK) to daily_tasks so tasks are linked to habits
-- 3. Update CHECK constraint on frequency

-- ── Step 1: custom_days column ────────────────────────────────────
ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS custom_days TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.habits.custom_days IS
  'Array of day names for Custom frequency, e.g. ["Monday","Wednesday","Friday"]';

-- ── Step 2: habit_id on daily_tasks ───────────────────────────────
ALTER TABLE public.daily_tasks
  ADD COLUMN IF NOT EXISTS habit_id UUID REFERENCES public.habits(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_daily_tasks_habit_id
  ON public.daily_tasks (habit_id)
  WHERE habit_id IS NOT NULL;

-- Update RLS so tasks linked to a habit are writable
DROP POLICY IF EXISTS "daily_tasks_owner_all_v2" ON public.daily_tasks;
CREATE POLICY "daily_tasks_owner_all_v2" ON public.daily_tasks
  FOR ALL TO authenticated
  USING (
    -- Either: owns the parent log
    EXISTS (
      SELECT 1 FROM public.daily_logs dl
      WHERE dl.id = log_id AND dl.user_id = (SELECT auth.uid())
    )
    OR
    -- Or: owns the linked habit
    EXISTS (
      SELECT 1 FROM public.habits h
      WHERE h.id = habit_id AND h.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.daily_logs dl
      WHERE dl.id = log_id AND dl.user_id = (SELECT auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM public.habits h
      WHERE h.id = habit_id AND h.user_id = (SELECT auth.uid())
    )
  );

-- ── Step 3: Update frequency CHECK to allow future values ─────────
ALTER TABLE public.habits
  DROP CONSTRAINT IF EXISTS habits_frequency_check;

ALTER TABLE public.habits
  ADD CONSTRAINT habits_frequency_check
  CHECK (frequency IN ('Daily', 'Weekdays', 'Weekends', 'Custom'));