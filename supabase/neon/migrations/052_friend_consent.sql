SET search_path = public, extensions;

-- A friend row is created by the recipient while accepting that recipient's
-- pending request. The sender cannot create a relationship by themselves.
DROP POLICY IF EXISTS "friends_insert_participant" ON public.friends;
CREATE POLICY "friends_insert_accepted_request"
  ON public.friends
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.friend_requests AS fr
      WHERE fr.status = 'pending'
        AND fr.recipient_id = auth.uid()
        AND (
          (fr.sender_id = friends.user_id_1 AND fr.recipient_id = friends.user_id_2)
          OR
          (fr.sender_id = friends.user_id_2 AND fr.recipient_id = friends.user_id_1)
        )
    )
  );

-- Only the recipient may accept or reject a pending request. Keep identity
-- fields immutable so the sender cannot rewrite a request into consent from
-- another user.
DROP POLICY IF EXISTS "friend_requests_update_recipient" ON public.friend_requests;
CREATE POLICY "friend_requests_update_recipient"
  ON public.friend_requests
  FOR UPDATE
  TO authenticated
  USING (
    recipient_id = auth.uid()
    AND status = 'pending'
  )
  WITH CHECK (
    recipient_id = auth.uid()
    AND status IN ('accepted', 'rejected')
  );

CREATE OR REPLACE FUNCTION public.guard_friend_request_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NEW.sender_id IS DISTINCT FROM OLD.sender_id
    OR NEW.recipient_id IS DISTINCT FROM OLD.recipient_id
    OR NEW.recipient_email IS DISTINCT FROM OLD.recipient_email THEN
    RAISE EXCEPTION 'Friend request participants cannot be changed'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
    AND (OLD.status <> 'pending' OR NEW.status NOT IN ('accepted', 'rejected')) THEN
    RAISE EXCEPTION 'Only a pending request can be accepted or rejected'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_friend_request_update ON public.friend_requests;
CREATE TRIGGER guard_friend_request_update
  BEFORE UPDATE OF sender_id, recipient_id, recipient_email, status
  ON public.friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_friend_request_update();

REVOKE EXECUTE ON FUNCTION public.guard_friend_request_update()
  FROM PUBLIC, anonymous, authenticated;
