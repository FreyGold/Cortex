-- Migration 037: Update Pomodoro Session Types
-- Drops the strict check constraint on pomodoro_sessions to support the standard Focus, Short Break, Long Break modes.

ALTER TABLE public.pomodoro_sessions DROP CONSTRAINT IF EXISTS pomodoro_sessions_type_check;

-- Add a new check constraint that includes the standard Pomodoro modes and legacy modes
ALTER TABLE public.pomodoro_sessions ADD CONSTRAINT pomodoro_sessions_type_check CHECK (type IN ('Deep Work', 'Short Focus', 'Review', 'Planning', 'Focus', 'Short Break', 'Long Break'));
