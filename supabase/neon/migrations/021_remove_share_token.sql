SET search_path = public, extensions;

-- 021_remove_share_token.sql
-- Remove the share_token column as it is no longer used for sharing.

-- Remove policies that still reference the column before dropping it.
DROP POLICY IF EXISTS "notes_shared_read" ON public.notes;
DROP POLICY IF EXISTS "note_shares_read" ON public.note_shares;
DROP POLICY IF EXISTS "note_shares_shared_user_read" ON public.note_shares;

ALTER TABLE public.note_shares DROP COLUMN IF EXISTS share_token;
