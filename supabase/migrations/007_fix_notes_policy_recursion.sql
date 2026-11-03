CREATE OR REPLACE FUNCTION public.is_note_owner(note_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.notes n
    WHERE n.id = note_uuid
      AND n.user_id = user_uuid
  );
$$;

REVOKE ALL ON FUNCTION public.is_note_owner(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_note_owner(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "note_shares_owner_manage" ON public.note_shares;
CREATE POLICY "note_shares_owner_manage"
  ON public.note_shares
  FOR ALL
  TO authenticated
  USING (public.is_note_owner(note_id, auth.uid()))
  WITH CHECK (public.is_note_owner(note_id, auth.uid()));
