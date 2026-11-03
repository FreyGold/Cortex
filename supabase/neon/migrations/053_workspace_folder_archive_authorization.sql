-- Make recursive folder archival fail clearly and honor workspace editors.
-- Membership is active while its workspace_members row exists. The current
-- schema has no expiration or revocation timestamp on that table.

CREATE OR REPLACE FUNCTION public.archive_folder_recursive(f_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  caller_id UUID := auth.uid();
  folder_workspace_id UUID;
  folder_owner_id UUID;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Sign-in is required' USING ERRCODE = '42501';
  END IF;

  SELECT f.workspace_id, f.user_id
    INTO folder_workspace_id, folder_owner_id
  FROM public.folders AS f
  WHERE f.id = f_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Folder not found' USING ERRCODE = 'P0002';
  END IF;

  IF folder_workspace_id IS NULL THEN
    IF folder_owner_id IS DISTINCT FROM caller_id THEN
      RAISE EXCEPTION 'You cannot archive this folder' USING ERRCODE = '42501';
    END IF;
  ELSIF NOT (
    public.is_workspace_owner_v2(folder_workspace_id)
    OR public.has_workspace_role(folder_workspace_id, ARRAY['editor', 'admin'])
  ) THEN
    RAISE EXCEPTION 'You cannot archive this folder' USING ERRCODE = '42501';
  END IF;

  WITH RECURSIVE folder_tree(id) AS (
    SELECT f.id
    FROM public.folders AS f
    WHERE f.id = f_id
      AND f.workspace_id IS NOT DISTINCT FROM folder_workspace_id
      AND (folder_workspace_id IS NOT NULL OR f.user_id = caller_id)

    UNION

    SELECT child.id
    FROM public.folders AS child
    JOIN folder_tree AS parent ON parent.id = child.parent_id
    WHERE child.workspace_id IS NOT DISTINCT FROM folder_workspace_id
      AND (folder_workspace_id IS NOT NULL OR child.user_id = caller_id)
  )
  UPDATE public.folders AS f
  SET is_archived = TRUE,
      archived_at = COALESCE(f.archived_at, NOW())
  WHERE f.id IN (SELECT id FROM folder_tree);

  WITH RECURSIVE folder_tree(id) AS (
    SELECT f.id
    FROM public.folders AS f
    WHERE f.id = f_id
      AND f.workspace_id IS NOT DISTINCT FROM folder_workspace_id
      AND (folder_workspace_id IS NOT NULL OR f.user_id = caller_id)

    UNION

    SELECT child.id
    FROM public.folders AS child
    JOIN folder_tree AS parent ON parent.id = child.parent_id
    WHERE child.workspace_id IS NOT DISTINCT FROM folder_workspace_id
      AND (folder_workspace_id IS NOT NULL OR child.user_id = caller_id)
  )
  UPDATE public.notes AS n
  SET is_archived = TRUE,
      archived_at = COALESCE(n.archived_at, NOW()),
      status = 'archived'
  WHERE n.folder_id IN (SELECT id FROM folder_tree)
    AND n.workspace_id IS NOT DISTINCT FROM folder_workspace_id
    AND (folder_workspace_id IS NOT NULL OR n.user_id = caller_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_folder_recursive(f_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  caller_id UUID := auth.uid();
  folder_workspace_id UUID;
  folder_owner_id UUID;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Sign-in is required' USING ERRCODE = '42501';
  END IF;

  SELECT f.workspace_id, f.user_id
    INTO folder_workspace_id, folder_owner_id
  FROM public.folders AS f
  WHERE f.id = f_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Folder not found' USING ERRCODE = 'P0002';
  END IF;

  IF folder_workspace_id IS NULL THEN
    IF folder_owner_id IS DISTINCT FROM caller_id THEN
      RAISE EXCEPTION 'You cannot restore this folder' USING ERRCODE = '42501';
    END IF;
  ELSIF NOT (
    public.is_workspace_owner_v2(folder_workspace_id)
    OR public.has_workspace_role(folder_workspace_id, ARRAY['editor', 'admin'])
  ) THEN
    RAISE EXCEPTION 'You cannot restore this folder' USING ERRCODE = '42501';
  END IF;

  WITH RECURSIVE folder_tree(id) AS (
    SELECT f.id
    FROM public.folders AS f
    WHERE f.id = f_id
      AND f.workspace_id IS NOT DISTINCT FROM folder_workspace_id
      AND (folder_workspace_id IS NOT NULL OR f.user_id = caller_id)

    UNION

    SELECT child.id
    FROM public.folders AS child
    JOIN folder_tree AS parent ON parent.id = child.parent_id
    WHERE child.workspace_id IS NOT DISTINCT FROM folder_workspace_id
      AND (folder_workspace_id IS NOT NULL OR child.user_id = caller_id)
  )
  UPDATE public.folders AS f
  SET is_archived = FALSE,
      archived_at = NULL
  WHERE f.id IN (SELECT id FROM folder_tree);

  WITH RECURSIVE folder_tree(id) AS (
    SELECT f.id
    FROM public.folders AS f
    WHERE f.id = f_id
      AND f.workspace_id IS NOT DISTINCT FROM folder_workspace_id
      AND (folder_workspace_id IS NOT NULL OR f.user_id = caller_id)

    UNION

    SELECT child.id
    FROM public.folders AS child
    JOIN folder_tree AS parent ON parent.id = child.parent_id
    WHERE child.workspace_id IS NOT DISTINCT FROM folder_workspace_id
      AND (folder_workspace_id IS NOT NULL OR child.user_id = caller_id)
  )
  UPDATE public.notes AS n
  SET is_archived = FALSE,
      archived_at = NULL,
      status = 'active'
  WHERE n.folder_id IN (SELECT id FROM folder_tree)
    AND n.workspace_id IS NOT DISTINCT FROM folder_workspace_id
    AND (folder_workspace_id IS NOT NULL OR n.user_id = caller_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.archive_folder_recursive(UUID) FROM PUBLIC, anonymous;
REVOKE EXECUTE ON FUNCTION public.restore_folder_recursive(UUID) FROM PUBLIC, anonymous;
GRANT EXECUTE ON FUNCTION public.archive_folder_recursive(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_folder_recursive(UUID) TO authenticated;
