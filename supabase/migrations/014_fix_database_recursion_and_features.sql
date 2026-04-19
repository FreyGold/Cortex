-- 014_fix_database_recursion_and_features.sql
-- 1. Add owner_id to child tables to break RLS recursion
ALTER TABLE public.note_shares ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.course_notes ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(id);

-- 2. Populate owner_id from parent notes
UPDATE public.note_shares ns
SET owner_id = (SELECT user_id FROM public.notes n WHERE n.id = ns.note_id)
WHERE owner_id IS NULL;

UPDATE public.course_notes cn
SET owner_id = (SELECT user_id FROM public.notes n WHERE n.id = cn.note_id)
WHERE owner_id IS NULL;

-- 3. Add archiving fields to notes
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived'));

-- 4. Clean up all old policies on notes and related tables
DROP POLICY IF EXISTS "notes_owner_access" ON public.notes;
DROP POLICY IF EXISTS "notes_shared_access" ON public.notes;
DROP POLICY IF EXISTS "notes_shared_read" ON public.notes;
DROP POLICY IF EXISTS "notes_owner_full_access" ON public.notes;
DROP POLICY IF EXISTS "notes_crud_own" ON public.notes;

DROP POLICY IF EXISTS "note_shares_owner_access" ON public.note_shares;
DROP POLICY IF EXISTS "note_shares_recipient_read" ON public.note_shares;
DROP POLICY IF EXISTS "note_shares_owner_manage" ON public.note_shares;
DROP POLICY IF EXISTS "note_shares_shared_user_read" ON public.note_shares;

DROP POLICY IF EXISTS "course_notes_read" ON public.course_notes;
DROP POLICY IF EXISTS "course_notes_owner_manage" ON public.course_notes;

-- 5. Set up NEW, NON-RECURSIVE policies

-- NOTES: 
-- Owner check is simple (direct column compare).
-- Sharing check queries child tables which NO LONGER query notes back.
CREATE POLICY "notes_owner_all"
  ON public.notes FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notes_shared_read"
  ON public.notes FOR SELECT TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM public.note_shares ns 
      WHERE ns.note_id = id 
      AND (ns.shared_with_user_id = auth.uid() OR ns.share_token IS NOT NULL)
      AND (ns.expires_at IS NULL OR ns.expires_at > now())
    )
    OR EXISTS (
      SELECT 1 FROM public.course_notes WHERE note_id = id
    )
  );

-- NOTE_SHARES:
-- Use the new owner_id column to verify ownership without a subquery to 'notes'.
CREATE POLICY "note_shares_owner_manage"
  ON public.note_shares FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "note_shares_read"
  ON public.note_shares FOR SELECT TO authenticated, anon
  USING (shared_with_user_id = auth.uid() OR share_token IS NOT NULL);

-- COURSE_NOTES:
CREATE POLICY "course_notes_owner_manage"
  ON public.course_notes FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "course_notes_public_read"
  ON public.course_notes FOR SELECT TO authenticated, anon
  USING (TRUE);

-- 6. Trigger to automatically set owner_id on new rows
CREATE OR REPLACE FUNCTION public.set_child_owner_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.owner_id IS NULL THEN
    NEW.owner_id := (SELECT user_id FROM public.notes WHERE id = NEW.note_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_note_shares_owner ON public.note_shares;
CREATE TRIGGER tr_note_shares_owner BEFORE INSERT ON public.note_shares
  FOR EACH ROW EXECUTE FUNCTION public.set_child_owner_id();

DROP TRIGGER IF EXISTS tr_course_notes_owner ON public.course_notes;
CREATE TRIGGER tr_course_notes_owner BEFORE INSERT ON public.course_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_child_owner_id();

-- 7. View for getting course resources (including these shared notes)
-- Assuming we want to show notes in the course catalog as resources
-- This is handled by the backend CreateResource logic, but making it clean.
