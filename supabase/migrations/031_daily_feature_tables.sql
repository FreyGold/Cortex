-- Migration 031: Daily Feature Tables
-- Creates daily_logs, daily_tasks, habits, habit_logs tables
-- along with RLS policies, indexes, and the search_daily_logs RPC.

-- ──────────────────────────────────────────────────────────
-- 1. daily_logs
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  workspace_id  UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  rating        TEXT CHECK (rating IN ('😊','😐','😔','🔥','💪') OR rating IS NULL),
  highlight     TEXT,
  content       JSONB,
  content_text  TEXT,
  embedding     vector(384),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date, workspace_id)
);

ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daily_logs_owner_all" ON public.daily_logs;
CREATE POLICY "daily_logs_owner_all" ON public.daily_logs
  FOR ALL TO authenticated
  USING  (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Vector similarity search index
CREATE INDEX IF NOT EXISTS idx_daily_logs_embedding
  ON public.daily_logs USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date
  ON public.daily_logs (user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_logs_workspace
  ON public.daily_logs (workspace_id)
  WHERE workspace_id IS NOT NULL;


-- ──────────────────────────────────────────────────────────
-- 2. daily_tasks
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id       UUID NOT NULL REFERENCES public.daily_logs(id) ON DELETE CASCADE,
  text         TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;

-- Tasks inherit ownership through the log's user_id
DROP POLICY IF EXISTS "daily_tasks_owner_all" ON public.daily_tasks;
CREATE POLICY "daily_tasks_owner_all" ON public.daily_tasks
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.daily_logs dl
      WHERE dl.id = log_id AND dl.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.daily_logs dl
      WHERE dl.id = log_id AND dl.user_id = (SELECT auth.uid())
    )
  );

CREATE INDEX IF NOT EXISTS idx_daily_tasks_log_id
  ON public.daily_tasks (log_id);


-- ──────────────────────────────────────────────────────────
-- 3. habits
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.habits (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text       TEXT NOT NULL,
  frequency  TEXT NOT NULL DEFAULT 'Daily'
               CHECK (frequency IN ('Daily', 'Weekdays', 'Weekends', 'Custom')),
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "habits_owner_all" ON public.habits;
CREATE POLICY "habits_owner_all" ON public.habits
  FOR ALL TO authenticated
  USING  (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE INDEX IF NOT EXISTS idx_habits_user_id
  ON public.habits (user_id);


-- ──────────────────────────────────────────────────────────
-- 4. habit_logs
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.habit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id   UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  completed  BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (habit_id, date)
);

ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

-- Habit logs inherit ownership via the habit's user_id
DROP POLICY IF EXISTS "habit_logs_owner_all" ON public.habit_logs;
CREATE POLICY "habit_logs_owner_all" ON public.habit_logs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.habits h
      WHERE h.id = habit_id AND h.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.habits h
      WHERE h.id = habit_id AND h.user_id = (SELECT auth.uid())
    )
  );

CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id_date
  ON public.habit_logs (habit_id, date DESC);


-- ──────────────────────────────────────────────────────────
-- 5. profiles: add daily_auto_populate_habits column
--    (referenced by DailyRepository but may not exist yet)
-- ──────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS daily_auto_populate_habits BOOLEAN DEFAULT FALSE;


-- ──────────────────────────────────────────────────────────
-- 6. search_daily_logs RPC
--    Semantic search over daily log embeddings.
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.search_daily_logs(
  query_embedding   vector(384),
  user_id_filter    UUID,
  match_threshold   FLOAT DEFAULT 0.5,
  match_count       INT   DEFAULT 10
)
RETURNS TABLE (
  id           UUID,
  date         DATE,
  highlight    TEXT,
  content_text TEXT,
  similarity   FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dl.id,
    dl.date,
    dl.highlight,
    dl.content_text,
    1 - (dl.embedding <=> query_embedding) AS similarity
  FROM public.daily_logs dl
  WHERE
    dl.user_id = user_id_filter
    AND dl.embedding IS NOT NULL
    AND 1 - (dl.embedding <=> query_embedding) > match_threshold
  ORDER BY dl.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_daily_logs(vector, UUID, FLOAT, INT) TO authenticated;
