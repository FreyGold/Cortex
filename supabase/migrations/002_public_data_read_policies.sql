ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.majors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.year_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_universities" ON public.universities;
CREATE POLICY "public_read_universities"
  ON public.universities
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "public_read_colleges" ON public.colleges;
CREATE POLICY "public_read_colleges"
  ON public.colleges
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "public_read_majors" ON public.majors;
CREATE POLICY "public_read_majors"
  ON public.majors
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "public_read_academic_years" ON public.academic_years;
CREATE POLICY "public_read_academic_years"
  ON public.academic_years
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "public_read_year_levels" ON public.year_levels;
CREATE POLICY "public_read_year_levels"
  ON public.year_levels
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "public_read_doctors" ON public.doctors;
CREATE POLICY "public_read_doctors"
  ON public.doctors
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "public_read_courses" ON public.courses;
CREATE POLICY "public_read_courses"
  ON public.courses
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "public_read_course_doctors" ON public.course_doctors;
CREATE POLICY "public_read_course_doctors"
  ON public.course_doctors
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "public_read_resources" ON public.resources;
CREATE POLICY "public_read_resources"
  ON public.resources
  FOR SELECT
  TO anon, authenticated
  USING (TRUE);
