-- Migration 039: Group and Friends Leaderboard RPCs
-- Adds missing RPC functions for group-specific and friends-only leaderboards.
-- Also updates the global get_leaderboard() to include the name field.

-- ──────────────────────────────────────────────────────────
-- 0. Update get_leaderboard() to include name field
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  name TEXT,
  total_seconds BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  WITH today_sessions AS (
    SELECT
      ps.user_id,
      COALESCE(ps.actual_duration_seconds, ps.duration * 60) AS seconds
    FROM pomodoro_sessions ps
    WHERE ps.start_time >= CURRENT_DATE
      AND ps.start_time < CURRENT_DATE + INTERVAL '1 day'
      AND ps.completed = TRUE
      AND (ps.type = 'Focus' OR ps.type = 'Deep Work')
  ),
  agg AS (
    SELECT
      ts.user_id,
      SUM(ts.seconds)::BIGINT AS total_seconds
    FROM today_sessions ts
    GROUP BY ts.user_id
  )
  SELECT
    agg.user_id,
    COALESCE(p.email, '') AS email,
    COALESCE(p.name, p.email, '') AS name,
    agg.total_seconds
  FROM agg
  LEFT JOIN profiles p ON p.id = agg.user_id
  ORDER BY agg.total_seconds DESC;
$$;

-- ──────────────────────────────────────────────────────────
-- 1. RPC: get_group_leaderboard(p_group_id)
-- Returns total focus time today for members of a specific group
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_group_leaderboard(p_group_id UUID)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  name TEXT,
  total_seconds BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  WITH group_users AS (
    SELECT gm.user_id
    FROM public.group_members gm
    WHERE gm.group_id = p_group_id
  ),
  today_sessions AS (
    SELECT
      ps.user_id,
      COALESCE(ps.actual_duration_seconds, ps.duration * 60) AS seconds
    FROM pomodoro_sessions ps
    WHERE ps.start_time >= CURRENT_DATE
      AND ps.start_time < CURRENT_DATE + INTERVAL '1 day'
      AND ps.completed = TRUE
      AND (ps.type = 'Focus' OR ps.type = 'Deep Work')
      AND ps.user_id IN (SELECT user_id FROM group_users)
  ),
  agg AS (
    SELECT
      ts.user_id,
      SUM(ts.seconds)::BIGINT AS total_seconds
    FROM today_sessions ts
    GROUP BY ts.user_id
  )
  SELECT
    agg.user_id,
    COALESCE(p.email, '') AS email,
    COALESCE(p.name, p.email, '') AS name,
    agg.total_seconds
  FROM agg
  LEFT JOIN profiles p ON p.id = agg.user_id
  ORDER BY agg.total_seconds DESC;
$$;

-- ──────────────────────────────────────────────────────────
-- 2. RPC: get_friends_leaderboard(p_user_id)
-- Returns total focus time today for friends of a specific user
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_friends_leaderboard(p_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  name TEXT,
  total_seconds BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  WITH friend_users AS (
    SELECT
      CASE WHEN user_id_1 = p_user_id THEN user_id_2 ELSE user_id_1 END AS friend_id
    FROM public.friends
    WHERE user_id_1 = p_user_id OR user_id_2 = p_user_id
  ),
  today_sessions AS (
    SELECT
      ps.user_id,
      COALESCE(ps.actual_duration_seconds, ps.duration * 60) AS seconds
    FROM pomodoro_sessions ps
    WHERE ps.start_time >= CURRENT_DATE
      AND ps.start_time < CURRENT_DATE + INTERVAL '1 day'
      AND ps.completed = TRUE
      AND (ps.type = 'Focus' OR ps.type = 'Deep Work')
      AND ps.user_id IN (SELECT friend_id FROM friend_users)
  ),
  agg AS (
    SELECT
      ts.user_id,
      SUM(ts.seconds)::BIGINT AS total_seconds
    FROM today_sessions ts
    GROUP BY ts.user_id
  )
  SELECT
    agg.user_id,
    COALESCE(p.email, '') AS email,
    COALESCE(p.name, p.email, '') AS name,
    agg.total_seconds
  FROM agg
  LEFT JOIN profiles p ON p.id = agg.user_id
  ORDER BY agg.total_seconds DESC;
$$;
