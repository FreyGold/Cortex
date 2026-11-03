-- 1. Create a parameterless SECURITY DEFINER function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = (select auth.uid())
      AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;

-- 2. Update Profiles read policy to avoid infinite recursion
DROP POLICY IF EXISTS "profiles_read_self_or_admin" ON public.profiles;
CREATE POLICY "profiles_read_self_or_admin" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = (select auth.uid())
    OR public.is_current_user_admin()
  );

-- 3. Update Profiles update policy to avoid infinite recursion
DROP POLICY IF EXISTS "profiles_update_self_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_self_or_admin" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    id = (select auth.uid())
    OR public.is_current_user_admin()
  )
  WITH CHECK (
    id = (select auth.uid())
    OR public.is_current_user_admin()
  );