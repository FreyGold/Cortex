-- Migration 038: Social Features (Groups, Friends, Leaderboard)
-- Creates tables for groups, friend requests, friends, and leaderboard functionality.

-- ──────────────────────────────────────────────────────────
-- 0. Helper function to prevent RLS recursion
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_group_member(target_group_id UUID, check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM public.group_members WHERE group_id = target_group_id AND user_id = check_user_id);
$$;

-- ──────────────────────────────────────────────────────────
-- 1. groups
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.groups (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  description   TEXT,
  created_by    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "groups_view_members" ON public.groups;
CREATE POLICY "groups_view_members" ON public.groups
  FOR SELECT TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    OR public.is_group_member(id, (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "groups_insert_own" ON public.groups;
CREATE POLICY "groups_insert_own" ON public.groups
  FOR INSERT TO authenticated
  WITH CHECK (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "groups_update_owner" ON public.groups;
CREATE POLICY "groups_update_owner" ON public.groups
  FOR UPDATE TO authenticated
  USING (created_by = (SELECT auth.uid()))
  WITH CHECK (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "groups_delete_owner" ON public.groups;
CREATE POLICY "groups_delete_owner" ON public.groups
  FOR DELETE TO authenticated
  USING (created_by = (SELECT auth.uid()));

-- ──────────────────────────────────────────────────────────
-- 2. group_members
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.group_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "group_members_view_own" ON public.group_members;
CREATE POLICY "group_members_view_own" ON public.group_members
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR group_id IN (SELECT id FROM public.groups WHERE created_by = (SELECT auth.uid()))
    OR public.is_group_member(group_id, (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "group_members_insert_owner" ON public.group_members;
CREATE POLICY "group_members_insert_owner" ON public.group_members
  FOR INSERT TO authenticated
  WITH CHECK (
    group_id IN (SELECT id FROM public.groups WHERE created_by = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "group_members_delete_owner" ON public.group_members;
CREATE POLICY "group_members_delete_owner" ON public.group_members
  FOR DELETE TO authenticated
  USING (
    group_id IN (SELECT id FROM public.groups WHERE created_by = (SELECT auth.uid()))
  );

-- ──────────────────────────────────────────────────────────
-- 3. friend_requests
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  recipient_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "friend_requests_view_participant" ON public.friend_requests;
CREATE POLICY "friend_requests_view_participant" ON public.friend_requests
  FOR SELECT TO authenticated
  USING (
    sender_id = (SELECT auth.uid())
    OR (recipient_id IS NOT NULL AND recipient_id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "friend_requests_insert_sender" ON public.friend_requests;
CREATE POLICY "friend_requests_insert_sender" ON public.friend_requests
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "friend_requests_update_recipient" ON public.friend_requests;
CREATE POLICY "friend_requests_update_recipient" ON public.friend_requests
  FOR UPDATE TO authenticated
  USING (
    (recipient_id IS NOT NULL AND recipient_id = (SELECT auth.uid()))
    OR sender_id = (SELECT auth.uid())
  )
  WITH CHECK (
    (recipient_id IS NOT NULL AND recipient_id = (SELECT auth.uid()))
    OR sender_id = (SELECT auth.uid())
  );

-- ──────────────────────────────────────────────────────────
-- 4. friends
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.friends (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_1  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id_2  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id_1, user_id_2),
  CHECK (user_id_1 < user_id_2)
);

ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "friends_view_participant" ON public.friends;
CREATE POLICY "friends_view_participant" ON public.friends
  FOR SELECT TO authenticated
  USING (
    user_id_1 = (SELECT auth.uid())
    OR user_id_2 = (SELECT auth.uid())
  );

-- ──────────────────────────────────────────────────────────
-- 5. RPC: get_leaderboard()
-- Returns total focus time today for all users (SECURITY DEFINER)
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
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
    agg.total_seconds
  FROM agg
  LEFT JOIN profiles p ON p.id = agg.user_id
  ORDER BY agg.total_seconds DESC;
$$;

-- ──────────────────────────────────────────────────────────
-- 6. RPC: get_user_monthly_log(p_user_id, p_year, p_month)
-- Returns daily aggregates for a specific user in a given month
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_monthly_log(
  p_user_id UUID,
  p_year INTEGER,
  p_month INTEGER
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
    AND EXTRACT(MONTH FROM ps.start_time) = p_month
  GROUP BY ps.start_time::DATE
  ORDER BY ps.start_time::DATE;
$$;

-- ──────────────────────────────────────────────────────────
-- Indexes
-- ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members (group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members (user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON public.friend_requests (sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_recipient ON public.friend_requests (recipient_email);
CREATE INDEX IF NOT EXISTS idx_friend_requests_recipient_id ON public.friend_requests (recipient_id) WHERE recipient_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_friends_user_id_1 ON public.friends (user_id_1);
CREATE INDEX IF NOT EXISTS idx_friends_user_id_2 ON public.friends (user_id_2);
