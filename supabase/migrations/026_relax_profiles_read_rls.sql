-- Allow authenticated users to read basic profile info of others for collaboration
DROP POLICY IF EXISTS "profiles_read_all_authenticated" ON public.profiles;
CREATE POLICY "profiles_read_all_authenticated"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (TRUE);
