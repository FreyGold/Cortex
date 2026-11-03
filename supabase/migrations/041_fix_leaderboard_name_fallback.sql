-- Migration 041: Fix leaderboard name fallback
-- Fixes COALESCE(p.name, '') -> COALESCE(p.name, p.email, '') so users without
-- a display name still show their email on leaderboards.

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
  WITH friend_ids AS (
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
      AND ps.user_id IN (SELECT friend_id FROM friend_ids)
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
