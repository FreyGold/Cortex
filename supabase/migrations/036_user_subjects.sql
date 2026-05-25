-- Migration 036: User Subjects and Pomodoro Enhancements

-- 1. Create user_subjects table
CREATE TABLE IF NOT EXISTS public.user_subjects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  color         TEXT DEFAULT '#3B82F6',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

ALTER TABLE public.user_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_subjects_owner_all" ON public.user_subjects
  FOR ALL TO authenticated
  USING  (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE INDEX IF NOT EXISTS idx_user_subjects_user_id
  ON public.user_subjects (user_id);

-- 2. Modify pomodoro_sessions
ALTER TABLE public.pomodoro_sessions
  ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.user_subjects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS actual_duration_seconds INTEGER;

CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_subject_id
  ON public.pomodoro_sessions (subject_id)
  WHERE subject_id IS NOT NULL;