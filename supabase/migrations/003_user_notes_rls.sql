ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_read_self_or_admin" ON public.profiles;
CREATE POLICY "profiles_read_self_or_admin"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "profiles_update_self_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_self_or_admin"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "notes_crud_own" ON public.notes;
CREATE POLICY "notes_crud_own"
  ON public.notes
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "folders_crud_own" ON public.folders;
CREATE POLICY "folders_crud_own"
  ON public.folders
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "tags_crud_own" ON public.tags;
CREATE POLICY "tags_crud_own"
  ON public.tags
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "note_shares_owner_manage" ON public.note_shares;
CREATE POLICY "note_shares_owner_manage"
  ON public.note_shares
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.notes n
      WHERE n.id = note_id
        AND n.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.notes n
      WHERE n.id = note_id
        AND n.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "note_shares_shared_user_read" ON public.note_shares;
CREATE POLICY "note_shares_shared_user_read"
  ON public.note_shares
  FOR SELECT
  TO authenticated
  USING (
    shared_with_user_id = auth.uid()
    OR (
      share_token IS NOT NULL
      AND (expires_at IS NULL OR expires_at > now())
    )
  );

DROP POLICY IF EXISTS "note_chunks_owner_access" ON public.note_chunks;
CREATE POLICY "note_chunks_owner_access"
  ON public.note_chunks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.notes n
      WHERE n.id = note_id
        AND n.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.notes n
      WHERE n.id = note_id
        AND n.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "resources_insert_verified_or_admin" ON public.resources;
CREATE POLICY "resources_insert_verified_or_admin"
  ON public.resources
  FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (p.is_verified = true OR p.role = 'admin')
    )
  );
