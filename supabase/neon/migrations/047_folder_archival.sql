SET search_path = public, extensions;

ALTER TABLE public.folders
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.archive_folder_recursive(f_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  caller_id UUID := auth.uid();
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Sign-in is required' USING ERRCODE = '42501';
  END IF;

  WITH RECURSIVE folder_tree(id) AS (
    SELECT f.id
    FROM public.folders AS f
    WHERE f.id = f_id AND f.user_id = caller_id

    UNION

    SELECT child.id
    FROM public.folders AS child
    JOIN folder_tree AS parent ON parent.id = child.parent_id
    WHERE child.user_id = caller_id
  )
  UPDATE public.folders AS f
  SET is_archived = TRUE,
      archived_at = COALESCE(f.archived_at, NOW())
  WHERE f.id IN (SELECT id FROM folder_tree);

  WITH RECURSIVE folder_tree(id) AS (
    SELECT f.id
    FROM public.folders AS f
    WHERE f.id = f_id AND f.user_id = caller_id

    UNION

    SELECT child.id
    FROM public.folders AS child
    JOIN folder_tree AS parent ON parent.id = child.parent_id
    WHERE child.user_id = caller_id
  )
  UPDATE public.notes AS n
  SET is_archived = TRUE,
      archived_at = COALESCE(n.archived_at, NOW()),
      status = 'archived'
  WHERE n.user_id = caller_id
    AND n.folder_id IN (SELECT id FROM folder_tree);
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_folder_recursive(f_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  caller_id UUID := auth.uid();
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Sign-in is required' USING ERRCODE = '42501';
  END IF;

  WITH RECURSIVE folder_tree(id) AS (
    SELECT f.id
    FROM public.folders AS f
    WHERE f.id = f_id AND f.user_id = caller_id

    UNION

    SELECT child.id
    FROM public.folders AS child
    JOIN folder_tree AS parent ON parent.id = child.parent_id
    WHERE child.user_id = caller_id
  )
  UPDATE public.folders AS f
  SET is_archived = FALSE,
      archived_at = NULL
  WHERE f.id IN (SELECT id FROM folder_tree);

  WITH RECURSIVE folder_tree(id) AS (
    SELECT f.id
    FROM public.folders AS f
    WHERE f.id = f_id AND f.user_id = caller_id

    UNION

    SELECT child.id
    FROM public.folders AS child
    JOIN folder_tree AS parent ON parent.id = child.parent_id
    WHERE child.user_id = caller_id
  )
  UPDATE public.notes AS n
  SET is_archived = FALSE,
      archived_at = NULL,
      status = 'active'
  WHERE n.user_id = caller_id
    AND n.folder_id IN (SELECT id FROM folder_tree);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.archive_folder_recursive(UUID) FROM PUBLIC, anonymous;
REVOKE EXECUTE ON FUNCTION public.restore_folder_recursive(UUID) FROM PUBLIC, anonymous;
GRANT EXECUTE ON FUNCTION public.archive_folder_recursive(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_folder_recursive(UUID) TO authenticated;
