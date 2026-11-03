-- 015_fix_notes_sharing_and_publishing.sql

-- 1. Fix resources table to support note-based resources
-- Make google_drive_id optional since notes don't have one
ALTER TABLE public.resources ALTER COLUMN google_drive_id DROP NOT NULL;

-- Add note_id column to link resources directly to Cortex notes
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE;

-- Update type check to include 'note'
ALTER TABLE public.resources DROP CONSTRAINT IF EXISTS resources_type_check;
ALTER TABLE public.resources ADD CONSTRAINT resources_type_check 
  CHECK (type IN ('lecture', 'exam', 'assignment', 'note', 'other'));

-- 2. Fix note_shares RLS issues
-- Ensure the owner_id is set correctly on insert so the policy doesn't fail.
-- The policy "note_shares_owner_manage" checks USING (owner_id = auth.uid())
-- and WITH CHECK (owner_id = auth.uid()).

CREATE OR REPLACE FUNCTION public.set_note_share_owner()
RETURNS TRIGGER AS $$
BEGIN
  -- Always set owner_id to the creator of the share (the current user)
  -- so that the RLS policy 'note_shares_owner_manage' can pass.
  NEW.owner_id := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_note_shares_owner_auth ON public.note_shares;
CREATE TRIGGER tr_note_shares_owner_auth
  BEFORE INSERT ON public.note_shares
  FOR EACH ROW EXECUTE FUNCTION public.set_note_share_owner();

-- Also ensure existing policies are broad enough for owners
DROP POLICY IF EXISTS "note_shares_owner_manage" ON public.note_shares;
CREATE POLICY "note_shares_owner_manage"
  ON public.note_shares FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());
