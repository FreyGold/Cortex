-- Keep owner full access
DROP POLICY IF EXISTS "notes_crud_own" ON public.notes;
DROP POLICY IF EXISTS "notes_owner_full_access" ON public.notes;
CREATE POLICY "notes_owner_full_access"
  ON public.notes
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow explicitly shared users to read shared notes
DROP POLICY IF EXISTS "notes_shared_user_read" ON public.notes;
CREATE POLICY "notes_shared_user_read"
  ON public.notes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.note_shares ns
      WHERE ns.note_id = notes.id
        AND ns.shared_with_user_id = auth.uid()
        AND (ns.expires_at IS NULL OR ns.expires_at > now())
    )
  );
