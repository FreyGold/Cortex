SET search_path = public, extensions;

-- Validate ownership and replace a note's tag links in one transaction. A
-- failed insert cannot leave the note without its previous tags.
CREATE OR REPLACE FUNCTION public.replace_note_tags(
  target_note_id UUID,
  target_tag_ids UUID[]
)
RETURNS SETOF public.note_tags
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  unique_tag_count BIGINT;
  owned_tag_count BIGINT;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.notes AS n
    WHERE n.id = target_note_id AND n.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Note not found or access denied' USING ERRCODE = '42501';
  END IF;

  SELECT count(DISTINCT requested.tag_id), count(DISTINCT t.id)
  INTO unique_tag_count, owned_tag_count
  FROM unnest(coalesce(target_tag_ids, ARRAY[]::UUID[])) AS requested(tag_id)
  LEFT JOIN public.tags AS t
    ON t.id = requested.tag_id
   AND t.user_id = auth.uid();

  IF owned_tag_count <> unique_tag_count THEN
    RAISE EXCEPTION 'One or more tags are missing or not owned by this user'
      USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.note_tags AS nt WHERE nt.note_id = target_note_id;

  RETURN QUERY
  INSERT INTO public.note_tags (note_id, tag_id)
  SELECT target_note_id, requested.tag_id
  FROM (
    SELECT DISTINCT tag_id
    FROM unnest(coalesce(target_tag_ids, ARRAY[]::UUID[])) AS requested(tag_id)
    WHERE tag_id IS NOT NULL
  ) AS requested
  RETURNING *;
END;
$$;

CREATE OR REPLACE FUNCTION public.respond_to_group_invitation(
  invitation_id UUID,
  response_status TEXT
)
RETURNS public.group_members
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  current_invitation public.group_invitations%ROWTYPE;
  current_member public.group_members%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR response_status NOT IN ('accepted', 'rejected') THEN
    RAISE EXCEPTION 'Invalid group invitation response' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO current_invitation
  FROM public.group_invitations AS gi
  WHERE gi.id = invitation_id
  FOR UPDATE;

  IF NOT FOUND OR current_invitation.invited_user_id IS DISTINCT FROM auth.uid()
     OR current_invitation.status <> 'pending'
     OR NOT EXISTS (
       SELECT 1 FROM public.profiles AS p
       WHERE p.id = auth.uid()
         AND lower(p.email) = lower(current_invitation.invited_email)
     ) THEN
    RAISE EXCEPTION 'Group invitation not found or no longer pending' USING ERRCODE = '42501';
  END IF;

  UPDATE public.group_invitations AS gi
  SET status = response_status, updated_at = NOW()
  WHERE gi.id = current_invitation.id;

  IF response_status = 'accepted' THEN
    SELECT * INTO current_member
    FROM public.group_members AS gm
    WHERE gm.group_id = current_invitation.group_id
      AND gm.user_id = auth.uid();

    IF FOUND THEN
      RETURN current_member;
    END IF;

    INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (current_invitation.group_id, auth.uid(), 'member')
    ON CONFLICT (group_id, user_id) DO UPDATE
      SET role = public.group_members.role
    RETURNING * INTO current_member;
    RETURN current_member;
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.join_group_by_code(invite_code TEXT)
RETURNS public.group_members
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  target_group_id UUID;
  current_member public.group_members%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication is required' USING ERRCODE = '42501';
  END IF;

  SELECT g.id INTO target_group_id
  FROM public.groups AS g
  WHERE upper(g.invite_code) = upper(trim($1));

  IF target_group_id IS NULL THEN
    RAISE EXCEPTION 'Invalid group invite code' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO current_member
  FROM public.group_members AS gm
  WHERE gm.group_id = target_group_id AND gm.user_id = auth.uid();
  IF FOUND THEN
    RETURN current_member;
  END IF;

  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (target_group_id, auth.uid(), 'member')
  ON CONFLICT (group_id, user_id) DO UPDATE
    SET role = public.group_members.role
  RETURNING * INTO current_member;
  RETURN current_member;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.replace_note_tags(UUID, UUID[])
  FROM PUBLIC, anonymous;
GRANT EXECUTE ON FUNCTION public.replace_note_tags(UUID, UUID[]) TO authenticated;
