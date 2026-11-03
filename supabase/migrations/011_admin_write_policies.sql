DROP POLICY IF EXISTS "admin_write_universities" ON public.universities;
CREATE POLICY "admin_write_universities"
  ON public.universities
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "admin_update_universities" ON public.universities;
CREATE POLICY "admin_update_universities"
  ON public.universities
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "admin_write_colleges" ON public.colleges;
CREATE POLICY "admin_write_colleges"
  ON public.colleges
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "admin_update_colleges" ON public.colleges;
CREATE POLICY "admin_update_colleges"
  ON public.colleges
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "admin_write_majors" ON public.majors;
CREATE POLICY "admin_write_majors"
  ON public.majors
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "admin_update_majors" ON public.majors;
CREATE POLICY "admin_update_majors"
  ON public.majors
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "admin_write_courses" ON public.courses;
CREATE POLICY "admin_write_courses"
  ON public.courses
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "admin_update_courses" ON public.courses;
CREATE POLICY "admin_update_courses"
  ON public.courses
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "admin_write_year_levels" ON public.year_levels;
CREATE POLICY "admin_write_year_levels"
  ON public.year_levels
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "admin_update_year_levels" ON public.year_levels;
CREATE POLICY "admin_update_year_levels"
  ON public.year_levels
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
