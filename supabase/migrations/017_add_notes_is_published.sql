-- 017_add_notes_is_published.sql

-- 1. Add is_published column to notes table
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;

-- 2. Add policy to allow public reading of published notes
DROP POLICY IF EXISTS "notes_public_read_published" ON public.notes;
CREATE POLICY "notes_public_read_published"
  ON public.notes
  FOR SELECT
  TO anon, authenticated
  USING (is_published = TRUE);

-- 3. Ensure note owners can still manage their notes (this shouldn't conflict)
-- The existing 'notes_crud_own' policy already covers user_id = auth.uid()
