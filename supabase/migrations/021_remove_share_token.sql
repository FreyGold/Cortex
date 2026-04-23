-- 021_remove_share_token.sql
-- Remove the share_token column as it is no longer used for sharing.

ALTER TABLE public.note_shares DROP COLUMN IF EXISTS share_token;
