-- Add role column to note_shares
ALTER TABLE public.note_shares ADD COLUMN role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor'));

-- Backfill role from can_edit
UPDATE public.note_shares SET role = 'editor' WHERE can_edit = true;
UPDATE public.note_shares SET role = 'viewer' WHERE can_edit = false;
