SET search_path = public, extensions;

-- Shared editors can change note content. Only the owner can change note
-- ownership, publication, archive, pin, folder, or workspace state.
CREATE OR REPLACE FUNCTION public.guard_shared_note_editor_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM OLD.user_id
     AND (
       (to_jsonb(NEW) - ARRAY['title', 'content', 'content_text', 'summary', 'suggested_tags', 'word_count', 'updated_at'])
       IS DISTINCT FROM
       (to_jsonb(OLD) - ARRAY['title', 'content', 'content_text', 'summary', 'suggested_tags', 'word_count', 'updated_at'])
     ) THEN
    RAISE EXCEPTION 'Shared editors can only change note content'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_shared_note_editor_update ON public.notes;
CREATE TRIGGER guard_shared_note_editor_update
  BEFORE UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_shared_note_editor_update();

REVOKE EXECUTE ON FUNCTION public.guard_shared_note_editor_update()
  FROM PUBLIC, anonymous, authenticated;

-- All social state changes that create membership or friendship happen in one
-- transaction. The caller must be the user who accepts or joins.
DROP POLICY IF EXISTS "friends_insert_accepted_request" ON public.friends;
DROP POLICY IF EXISTS "friend_requests_update_recipient" ON public.friend_requests;

CREATE OR REPLACE FUNCTION public.respond_to_friend_request(
  request_id UUID,
  response_status TEXT
)
RETURNS public.friend_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  current_request public.friend_requests%ROWTYPE;
  user_a UUID;
  user_b UUID;
BEGIN
  IF auth.uid() IS NULL OR response_status NOT IN ('accepted', 'rejected') THEN
    RAISE EXCEPTION 'Invalid friend request response' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO current_request
  FROM public.friend_requests AS fr
  WHERE fr.id = request_id
  FOR UPDATE;

  IF NOT FOUND OR current_request.recipient_id IS DISTINCT FROM auth.uid()
     OR current_request.status <> 'pending' THEN
    RAISE EXCEPTION 'Friend request not found or no longer pending' USING ERRCODE = '42501';
  END IF;

  IF response_status = 'accepted' THEN
    user_a := LEAST(current_request.sender_id, current_request.recipient_id);
    user_b := GREATEST(current_request.sender_id, current_request.recipient_id);
    INSERT INTO public.friends (user_id_1, user_id_2)
    VALUES (user_a, user_b)
    ON CONFLICT (user_id_1, user_id_2) DO NOTHING;
  END IF;

  UPDATE public.friend_requests AS fr
  SET status = response_status, updated_at = NOW()
  WHERE fr.id = current_request.id
  RETURNING * INTO current_request;
  RETURN current_request;
END;
$$;

DROP POLICY IF EXISTS "group_invitations_update_invitee" ON public.group_invitations;

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
  new_member public.group_members%ROWTYPE;
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
    INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (current_invitation.group_id, auth.uid(), 'member')
    RETURNING * INTO new_member;
    RETURN new_member;
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
  new_member public.group_members%ROWTYPE;
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

  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (target_group_id, auth.uid(), 'member')
  RETURNING * INTO new_member;
  RETURN new_member;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.respond_to_friend_request(UUID, TEXT)
  FROM PUBLIC, anonymous;
REVOKE EXECUTE ON FUNCTION public.respond_to_group_invitation(UUID, TEXT)
  FROM PUBLIC, anonymous;
REVOKE EXECUTE ON FUNCTION public.join_group_by_code(TEXT)
  FROM PUBLIC, anonymous;
GRANT EXECUTE ON FUNCTION public.respond_to_friend_request(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_to_group_invitation(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_group_by_code(TEXT) TO authenticated;
