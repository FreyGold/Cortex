-- Migration 040: Fix RLS policies for friends, friend_requests, and groups
-- Adds missing INSERT/DELETE policies and group join codes

-- ──────────────────────────────────────────────────────────
-- 1. friend_requests: Add DELETE policy for sender
-- ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "friend_requests_delete_sender" ON public.friend_requests;
CREATE POLICY "friend_requests_delete_sender" ON public.friend_requests
  FOR DELETE TO authenticated
  USING (sender_id = (SELECT auth.uid()));

-- ──────────────────────────────────────────────────────────
-- 2. friends: Add INSERT policy for participants
-- ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "friends_insert_participant" ON public.friends;
CREATE POLICY "friends_insert_participant" ON public.friends
  FOR INSERT TO authenticated
  WITH CHECK (
    (user_id_1 = (SELECT auth.uid()) AND user_id_2 != (SELECT auth.uid()))
    OR (user_id_2 = (SELECT auth.uid()) AND user_id_1 != (SELECT auth.uid()))
  );

-- ──────────────────────────────────────────────────────────
-- 3. friends: Add DELETE policy for participants
-- ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "friends_delete_participant" ON public.friends;
CREATE POLICY "friends_delete_participant" ON public.friends
  FOR DELETE TO authenticated
  USING (
    user_id_1 = (SELECT auth.uid())
    OR user_id_2 = (SELECT auth.uid())
  );

-- ──────────────────────────────────────────────────────────
-- 4. groups: Add invite_code column for link/code joining
-- ──────────────────────────────────────────────────────────
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;

CREATE OR REPLACE FUNCTION public.generate_group_invite_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.invite_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_groups_set_invite_code ON public.groups;
CREATE TRIGGER trg_groups_set_invite_code
  BEFORE INSERT ON public.groups
  FOR EACH ROW
  WHEN (NEW.invite_code IS NULL)
  EXECUTE FUNCTION public.generate_group_invite_code();

-- Backfill existing groups with invite codes
UPDATE public.groups SET invite_code = upper(substr(md5(random()::text || id::text || clock_timestamp()::text), 1, 8)) WHERE invite_code IS NULL;

-- ──────────────────────────────────────────────────────────
-- 5. group_invitations: Table for email-based group invites
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.group_invitations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id        UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  invited_email   TEXT NOT NULL,
  invited_by      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invited_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "group_invitations_view_participant" ON public.group_invitations;
CREATE POLICY "group_invitations_view_participant" ON public.group_invitations
  FOR SELECT TO authenticated
  USING (
    invited_by = (SELECT auth.uid())
    OR (invited_user_id IS NOT NULL AND invited_user_id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "group_invitations_insert_member" ON public.group_invitations;
CREATE POLICY "group_invitations_insert_member" ON public.group_invitations
  FOR INSERT TO authenticated
  WITH CHECK (
    invited_by = (SELECT auth.uid())
    AND group_id IN (SELECT id FROM public.groups WHERE created_by = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "group_invitations_update_invitee" ON public.group_invitations;
CREATE POLICY "group_invitations_update_invitee" ON public.group_invitations
  FOR UPDATE TO authenticated
  USING (invited_user_id = (SELECT auth.uid()))
  WITH CHECK (invited_user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "group_invitations_delete_sender" ON public.group_invitations;
CREATE POLICY "group_invitations_delete_sender" ON public.group_invitations
  FOR DELETE TO authenticated
  USING (invited_by = (SELECT auth.uid()));
