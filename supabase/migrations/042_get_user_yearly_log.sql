-- Migration 042: RPC for yearly user study log

CREATE OR REPLACE FUNCTION public.get_user_yearly_log(
  p_user_id UUID,
  p_year INTEGER
)
RETURNS TABLE (
  date DATE,
  total_seconds BIGINT,
  session_count INTEGER
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ps.start_time::DATE AS date,
    COALESCE(SUM(ps.actual_duration_seconds), SUM(ps.duration * 60))::BIGINT AS total_seconds,
    COUNT(*)::INTEGER AS session_count
  FROM pomodoro_sessions ps
  WHERE ps.user_id = p_user_id
    AND ps.completed = TRUE
    AND (ps.type = 'Focus' OR ps.type = 'Deep Work')
    AND EXTRACT(YEAR FROM ps.start_time) = p_year
  GROUP BY ps.start_time::DATE
  ORDER BY ps.start_time::DATE;
$$;
