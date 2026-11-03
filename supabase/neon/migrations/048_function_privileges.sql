SET search_path = public, extensions;

-- Neon Data API functions are executable by PUBLIC by default. The app has no
-- anonymous RPC path. Remove that default and grant only the authenticated
-- helpers and endpoints used by policies and backend repositories.
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anonymous;

GRANT EXECUTE ON FUNCTION public.is_admin_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_verified_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_note_owner(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_workspace_role(UUID, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_workspace_owner_v2(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_workspace_member_v2(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_workspace_owner(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_member(UUID, UUID) TO authenticated;

GRANT EXECUTE ON FUNCTION public.search_notes(vector, UUID, DOUBLE PRECISION, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_daily_logs(vector, UUID, DOUBLE PRECISION, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_leaderboard() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_group_leaderboard(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_friends_leaderboard(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_monthly_log(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_yearly_log(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.archive_folder_recursive(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_folder_recursive(UUID) TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anonymous;
