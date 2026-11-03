SET search_path = public, extensions;

-- Direct database-owner administration has no JWT subject. Data API requests
-- with authenticated JWTs still pass through the normal admin check.
CREATE OR REPLACE FUNCTION public.guard_profile_privileges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

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

-- The owner-only one-time bootstrap can now update a profile without DDL.
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'Use a direct database owner connection for first-admin setup'
      USING ERRCODE = '42501';
  END IF;

  PERFORM pg_advisory_xact_lock(20181210, 1);

  IF EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN
    RAISE EXCEPTION 'An admin already exists'
      USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles AS p WHERE p.id = target_user_id
  ) THEN
    RAISE EXCEPTION 'The target account must sign up first'
      USING ERRCODE = '23503';
  END IF;

  UPDATE public.profiles
  SET role = 'admin',
      is_verified = TRUE,
      verified_at = NOW(),
      verified_by = target_user_id
  WHERE id = target_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.bootstrap_first_admin(UUID)
  FROM PUBLIC, anonymous, authenticated;

-- Note editors can update shared note content. Viewers, expired shares, and
-- attempts to transfer note ownership fail the WITH CHECK predicate.
CREATE POLICY "notes_shared_editor_update"
  ON public.notes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.note_shares AS ns
      WHERE ns.note_id = notes.id
        AND ns.owner_id = notes.user_id
        AND ns.shared_with_user_id = auth.uid()
        AND ns.role = 'editor'
        AND ns.can_edit = TRUE
        AND (ns.expires_at IS NULL OR ns.expires_at > NOW())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.note_shares AS ns
      WHERE ns.note_id = notes.id
        AND ns.owner_id = notes.user_id
        AND ns.shared_with_user_id = auth.uid()
        AND ns.role = 'editor'
        AND ns.can_edit = TRUE
        AND (ns.expires_at IS NULL OR ns.expires_at > NOW())
    )
  );
