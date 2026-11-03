SET search_path = public, extensions;

-- Keep profile roles and verification fields under administrator control.
CREATE OR REPLACE FUNCTION public.guard_profile_privileges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF (
    NEW.role IS DISTINCT FROM OLD.role
    OR NEW.is_verified IS DISTINCT FROM OLD.is_verified
    OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
    OR NEW.verified_by IS DISTINCT FROM OLD.verified_by
  ) AND NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Only an administrator can change profile role or verification fields'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_profile_privileges ON public.profiles;
CREATE TRIGGER guard_profile_privileges
  BEFORE UPDATE OF role, is_verified, verified_at, verified_by
  ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_privileges();

-- Recompute child ownership from the parent note. Ignore client-supplied
-- owner_id values so callers cannot claim another user's note.
CREATE OR REPLACE FUNCTION public.set_child_owner_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  actual_owner UUID;
BEGIN
  SELECT n.user_id INTO actual_owner
  FROM public.notes AS n
  WHERE n.id = NEW.note_id;

  IF actual_owner IS NULL THEN
    RAISE EXCEPTION 'The parent note does not exist'
      USING ERRCODE = '23503';
  END IF;

  NEW.owner_id := actual_owner;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_note_shares_owner ON public.note_shares;
CREATE TRIGGER tr_note_shares_owner
  BEFORE INSERT OR UPDATE OF note_id, owner_id
  ON public.note_shares
  FOR EACH ROW
  EXECUTE FUNCTION public.set_child_owner_id();

DROP TRIGGER IF EXISTS tr_note_shares_owner_auth ON public.note_shares;
DROP TRIGGER IF EXISTS tr_course_notes_owner ON public.course_notes;
CREATE TRIGGER tr_course_notes_owner
  BEFORE INSERT OR UPDATE OF note_id, owner_id
  ON public.course_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_child_owner_id();

DROP POLICY IF EXISTS "course_notes_public_read" ON public.course_notes;
CREATE POLICY "course_notes_read_published"
  ON public.course_notes
  FOR SELECT
  TO anonymous, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.notes AS n
      WHERE n.id = course_notes.note_id
        AND n.is_published = TRUE
    )
  );

DROP POLICY IF EXISTS "course_notes_owner_manage" ON public.course_notes;
CREATE POLICY "course_notes_owner_manage"
  ON public.course_notes
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Keep unpublished note-share rows private. Shared users can still see shares
-- addressed to them, and owners retain full access through the owner policy.
DROP POLICY IF EXISTS "note_shares_read" ON public.note_shares;
DROP POLICY IF EXISTS "note_shares_shared_user_read" ON public.note_shares;
CREATE POLICY "note_shares_shared_user_read"
  ON public.note_shares
  FOR SELECT
  TO authenticated
  USING (shared_with_user_id = auth.uid());

DROP TRIGGER IF EXISTS tr_note_shares_owner_auth ON public.note_shares;
DROP POLICY IF EXISTS "note_shares_owner_manage" ON public.note_shares;
CREATE POLICY "note_shares_owner_manage"
  ON public.note_shares
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "notes_shared_read" ON public.notes;
CREATE POLICY "notes_shared_read"
  ON public.notes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.note_shares AS ns
      WHERE ns.note_id = notes.id
        AND ns.shared_with_user_id = auth.uid()
        AND (ns.expires_at IS NULL OR ns.expires_at > NOW())
    )
  );

-- Protect every note child table. A caller must own the note and tag before
-- adding a tag link. Note links must stay between notes owned by that caller.
ALTER TABLE public.note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "note_tags_read_visible_notes"
  ON public.note_tags
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.notes AS n WHERE n.id = note_tags.note_id)
    AND EXISTS (SELECT 1 FROM public.tags AS t WHERE t.id = note_tags.tag_id)
  );

CREATE POLICY "note_tags_manage_owned_rows"
  ON public.note_tags
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.notes AS n
      WHERE n.id = note_tags.note_id AND n.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.tags AS t
      WHERE t.id = note_tags.tag_id AND t.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.notes AS n
      WHERE n.id = note_tags.note_id AND n.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.tags AS t
      WHERE t.id = note_tags.tag_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "note_links_manage_owned_rows"
  ON public.note_links
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.notes AS n
      WHERE n.id = note_links.source_note_id AND n.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.notes AS n
      WHERE n.id = note_links.target_note_id AND n.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.notes AS n
      WHERE n.id = note_links.source_note_id AND n.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.notes AS n
      WHERE n.id = note_links.target_note_id AND n.user_id = auth.uid()
    )
  );

CREATE POLICY "note_versions_read_owned_notes"
  ON public.note_versions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.notes AS n
      WHERE n.id = note_versions.note_id AND n.user_id = auth.uid()
    )
  );

CREATE POLICY "note_versions_manage_owned_notes"
  ON public.note_versions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.notes AS n
      WHERE n.id = note_versions.note_id AND n.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.notes AS n
      WHERE n.id = note_versions.note_id AND n.user_id = auth.uid()
    )
    AND (created_by IS NULL OR created_by = auth.uid())
  );

CREATE POLICY "resource_ratings_read_own"
  ON public.resource_ratings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "resource_ratings_insert_own"
  ON public.resource_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "resource_ratings_update_own"
  ON public.resource_ratings
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "resource_ratings_delete_own"
  ON public.resource_ratings
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- These routines use SECURITY DEFINER to read data through RLS. Enforce the
-- requested user's identity inside each routine before reading private rows.
CREATE OR REPLACE FUNCTION public.search_notes(
  query_embedding vector,
  user_id_filter UUID,
  match_threshold DOUBLE PRECISION DEFAULT 0.5,
  match_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  note_id UUID,
  chunk_id UUID,
  title TEXT,
  chunk_text TEXT,
  heading TEXT,
  similarity FLOAT
)
LANGUAGE SQL
STABLE
SET search_path = public, extensions
AS $$
  SELECT
    n.id,
    nc.id,
    n.title,
    nc.chunk_text,
    nc.heading,
    1 - (nc.embedding <=> query_embedding)::FLOAT
  FROM public.note_chunks AS nc
  JOIN public.notes AS n ON n.id = nc.note_id
  WHERE user_id_filter = auth.uid()
    AND n.user_id = auth.uid()
    AND nc.embedding IS NOT NULL
    AND 1 - (nc.embedding <=> query_embedding) > match_threshold
  ORDER BY nc.embedding <=> query_embedding
  LIMIT LEAST(GREATEST(match_count, 0), 100);
$$;

CREATE OR REPLACE FUNCTION public.get_user_monthly_log(
  p_user_id UUID,
  p_year INTEGER,
  p_month INTEGER
)
RETURNS TABLE (date DATE, total_seconds BIGINT, session_count INTEGER)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ps.start_time::DATE,
    COALESCE(SUM(ps.actual_duration_seconds), SUM(ps.duration * 60))::BIGINT,
    COUNT(*)::INTEGER
  FROM public.pomodoro_sessions AS ps
  WHERE p_user_id = auth.uid()
    AND ps.user_id = auth.uid()
    AND ps.completed = TRUE
    AND ps.type IN ('Focus', 'Deep Work')
    AND EXTRACT(YEAR FROM ps.start_time) = p_year
    AND EXTRACT(MONTH FROM ps.start_time) = p_month
  GROUP BY ps.start_time::DATE
  ORDER BY ps.start_time::DATE;
$$;

CREATE OR REPLACE FUNCTION public.get_user_yearly_log(
  p_user_id UUID,
  p_year INTEGER
)
RETURNS TABLE (date DATE, total_seconds BIGINT, session_count INTEGER)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ps.start_time::DATE,
    COALESCE(SUM(ps.actual_duration_seconds), SUM(ps.duration * 60))::BIGINT,
    COUNT(*)::INTEGER
  FROM public.pomodoro_sessions AS ps
  WHERE p_user_id = auth.uid()
    AND ps.user_id = auth.uid()
    AND ps.completed = TRUE
    AND ps.type IN ('Focus', 'Deep Work')
    AND EXTRACT(YEAR FROM ps.start_time) = p_year
  GROUP BY ps.start_time::DATE
  ORDER BY ps.start_time::DATE;
$$;

CREATE OR REPLACE FUNCTION public.get_group_leaderboard(p_group_id UUID)
RETURNS TABLE (user_id UUID, email TEXT, name TEXT, total_seconds BIGINT)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH caller_in_group AS (
    SELECT EXISTS (
      SELECT 1
      FROM public.groups AS g
      WHERE g.id = p_group_id AND g.created_by = auth.uid()
    ) OR public.is_group_member(p_group_id, auth.uid()) AS allowed
  ),
  group_users AS (
    SELECT gm.user_id
    FROM public.group_members AS gm
    CROSS JOIN caller_in_group AS allowed
    WHERE gm.group_id = p_group_id AND allowed.allowed
  ),
  today_sessions AS (
    SELECT ps.user_id,
           COALESCE(ps.actual_duration_seconds, ps.duration * 60) AS seconds
    FROM public.pomodoro_sessions AS ps
    WHERE ps.start_time >= CURRENT_DATE
      AND ps.start_time < CURRENT_DATE + INTERVAL '1 day'
      AND ps.completed = TRUE
      AND ps.type IN ('Focus', 'Deep Work')
      AND ps.user_id IN (SELECT gu.user_id FROM group_users AS gu)
  )
  SELECT ps.user_id,
         COALESCE(p.email, ''),
         COALESCE(p.name, p.email, ''),
         SUM(ps.seconds)::BIGINT
  FROM today_sessions AS ps
  LEFT JOIN public.profiles AS p ON p.id = ps.user_id
  GROUP BY ps.user_id, p.email, p.name
  ORDER BY SUM(ps.seconds) DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_friends_leaderboard(p_user_id UUID)
RETURNS TABLE (user_id UUID, email TEXT, name TEXT, total_seconds BIGINT)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH relevant_users AS (
    SELECT auth.uid() AS uid
    WHERE p_user_id = auth.uid()
    UNION
    SELECT CASE WHEN f.user_id_1 = auth.uid() THEN f.user_id_2 ELSE f.user_id_1 END
    FROM public.friends AS f
    WHERE p_user_id = auth.uid()
      AND (f.user_id_1 = auth.uid() OR f.user_id_2 = auth.uid())
  ),
  today_sessions AS (
    SELECT ps.user_id,
           COALESCE(ps.actual_duration_seconds, ps.duration * 60) AS seconds
    FROM public.pomodoro_sessions AS ps
    WHERE ps.start_time >= CURRENT_DATE
      AND ps.start_time < CURRENT_DATE + INTERVAL '1 day'
      AND ps.completed = TRUE
      AND ps.type IN ('Focus', 'Deep Work')
      AND ps.user_id IN (SELECT ru.uid FROM relevant_users AS ru)
  )
  SELECT ps.user_id,
         COALESCE(p.email, ''),
         COALESCE(p.name, p.email, ''),
         SUM(ps.seconds)::BIGINT
  FROM today_sessions AS ps
  LEFT JOIN public.profiles AS p ON p.id = ps.user_id
  GROUP BY ps.user_id, p.email, p.name
  ORDER BY SUM(ps.seconds) DESC;
$$;

-- Public leaderboards require a signed-in account. Group membership checks
-- now run inside the RPC above. Private personal logs require self-identity.
REVOKE EXECUTE ON FUNCTION public.get_leaderboard() FROM PUBLIC, anonymous;
GRANT EXECUTE ON FUNCTION public.get_leaderboard() TO authenticated;

-- Private helpers and personal RPCs are available only to authenticated users.
REVOKE EXECUTE ON FUNCTION public.is_admin_user(UUID) FROM PUBLIC, anonymous;
REVOKE EXECUTE ON FUNCTION public.is_verified_user(UUID) FROM PUBLIC, anonymous;
REVOKE EXECUTE ON FUNCTION public.is_note_owner(UUID, UUID) FROM PUBLIC, anonymous;
REVOKE EXECUTE ON FUNCTION public.is_current_user_admin() FROM PUBLIC, anonymous;
REVOKE EXECUTE ON FUNCTION public.has_workspace_role(UUID, TEXT[]) FROM PUBLIC, anonymous;
REVOKE EXECUTE ON FUNCTION public.is_workspace_owner_v2(UUID) FROM PUBLIC, anonymous;
REVOKE EXECUTE ON FUNCTION public.is_workspace_member_v2(UUID) FROM PUBLIC, anonymous;
REVOKE EXECUTE ON FUNCTION public.is_workspace_owner(UUID, UUID) FROM PUBLIC, anonymous;
REVOKE EXECUTE ON FUNCTION public.is_workspace_member(UUID, TEXT) FROM PUBLIC, anonymous;
REVOKE EXECUTE ON FUNCTION public.is_group_member(UUID, UUID) FROM PUBLIC, anonymous;
REVOKE EXECUTE ON FUNCTION public.search_notes(vector, UUID, DOUBLE PRECISION, INTEGER) FROM PUBLIC, anonymous;
REVOKE EXECUTE ON FUNCTION public.search_daily_logs(vector, UUID, DOUBLE PRECISION, INTEGER) FROM PUBLIC, anonymous;
REVOKE EXECUTE ON FUNCTION public.get_group_leaderboard(UUID) FROM PUBLIC, anonymous;
REVOKE EXECUTE ON FUNCTION public.get_friends_leaderboard(UUID) FROM PUBLIC, anonymous;
REVOKE EXECUTE ON FUNCTION public.get_user_monthly_log(UUID, INTEGER, INTEGER) FROM PUBLIC, anonymous;
REVOKE EXECUTE ON FUNCTION public.get_user_yearly_log(UUID, INTEGER) FROM PUBLIC, anonymous;

GRANT EXECUTE ON FUNCTION public.is_admin_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_verified_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_note_owner(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_workspace_role(UUID, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_workspace_owner_v2(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_workspace_member_v2(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_workspace_owner(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_notes(vector, UUID, DOUBLE PRECISION, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_daily_logs(vector, UUID, DOUBLE PRECISION, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_group_leaderboard(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_friends_leaderboard(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_monthly_log(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_yearly_log(UUID, INTEGER) TO authenticated;

-- Restrict helper functions that accept caller-supplied identities so they
-- cannot be used to probe other users' private records.
CREATE OR REPLACE FUNCTION public.is_note_owner(note_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT user_uuid = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.notes AS n
      WHERE n.id = note_uuid AND n.user_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_owner(ws_id UUID, u_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT u_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.workspaces AS w
      WHERE w.id = ws_id AND w.owner_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id UUID, u_email TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT u_email = (auth.jwt() ->> 'email')
    AND EXISTS (
      SELECT 1 FROM public.workspace_members AS wm
      WHERE wm.workspace_id = ws_id AND wm.email = (auth.jwt() ->> 'email')
    );
$$;

CREATE OR REPLACE FUNCTION public.is_group_member(target_group_id UUID, check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT check_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.group_members AS gm
      WHERE gm.group_id = target_group_id AND gm.user_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_user(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT target_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_verified_user(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT target_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = auth.uid() AND p.is_verified = TRUE
    );
$$;

-- Explicit least-privilege table grants for the Neon Data API roles.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM PUBLIC, anonymous;
GRANT USAGE ON SCHEMA public TO anonymous, authenticated;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT SELECT ON public.universities, public.colleges, public.majors,
  public.academic_years, public.year_levels, public.doctors, public.courses,
  public.course_doctors, public.resources, public.notes, public.course_notes
  TO anonymous;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC, anonymous;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Preserve the same default grants for objects created by later migrations.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON TABLES FROM PUBLIC, anonymous;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM PUBLIC, anonymous;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
