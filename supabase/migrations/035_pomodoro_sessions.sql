-- Migration 035: Pomodoro Sessions Table
-- Creates pomodoro_sessions table for tracking focus sessions.

-- ──────────────────────────────────────────────────────────
-- 1. pomodoro_sessions
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pomodoro_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_time    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time      TIMESTAMPTZ,
  duration      INTEGER NOT NULL, -- Planned duration in minutes
  completed     BOOLEAN NOT NULL DEFAULT FALSE,
  type          TEXT NOT NULL DEFAULT 'Deep Work' CHECK (type IN ('Deep Work', 'Short Focus', 'Review', 'Planning')),
  log_id        UUID REFERENCES public.daily_logs(id) ON DELETE SET NULL,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pomodoro_sessions_owner_all" ON public.pomodoro_sessions;
CREATE POLICY "pomodoro_sessions_owner_all" ON public.pomodoro_sessions
  FOR ALL TO authenticated
  USING  (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_id
  ON public.pomodoro_sessions (user_id, start_time DESC);

CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_log_id
  ON public.pomodoro_sessions (log_id)
  WHERE log_id IS NOT NULL;
