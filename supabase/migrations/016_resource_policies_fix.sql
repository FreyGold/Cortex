-- 016_resource_policies_fix.sql

-- Add UPDATE and DELETE policies for resources
-- This fixes the "Cannot coerce the result to a single JSON object" error
-- which occurs when RLS blocks an update and returns 0 rows.

DROP POLICY IF EXISTS "resources_update_owner_or_admin" ON public.resources;
CREATE POLICY "resources_update_owner_or_admin"
  ON public.resources
  FOR UPDATE
  TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR public.is_admin_user(auth.uid())
  )
  WITH CHECK (
    uploaded_by = auth.uid()
    OR public.is_admin_user(auth.uid())
  );

DROP POLICY IF EXISTS "resources_delete_owner_or_admin" ON public.resources;
CREATE POLICY "resources_delete_owner_or_admin"
  ON public.resources
  FOR DELETE
  TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR public.is_admin_user(auth.uid())
  );

-- Add policies for course_doctors to allow managing instructors
-- Only admins can manage which doctors teach which courses
DROP POLICY IF EXISTS "admin_manage_course_doctors" ON public.course_doctors;
CREATE POLICY "admin_manage_course_doctors"
  ON public.course_doctors
  FOR ALL
  TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));

-- Also ensure doctors can be added by verified users or admins
DROP POLICY IF EXISTS "doctors_insert_verified_or_admin" ON public.doctors;
CREATE POLICY "doctors_insert_verified_or_admin"
  ON public.doctors
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_verified_user(auth.uid())
    OR public.is_admin_user(auth.uid())
  );
