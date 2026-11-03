-- 008_perf_optimizations.sql
-- Optimizing RLS helper functions to be STABLE instead of VOLATILE so Postgres caches the result during execution
CREATE OR REPLACE FUNCTION public.is_admin_user(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = target_user_id
      AND p.role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_verified_user(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = target_user_id
      AND p.is_verified = true
  );
$$;

-- Adding missing indexes for common foreign key lookups and JOINs
CREATE INDEX IF NOT EXISTS idx_colleges_university_id ON public.colleges(university_id);
CREATE INDEX IF NOT EXISTS idx_majors_college_id ON public.majors(college_id);
CREATE INDEX IF NOT EXISTS idx_courses_major_id ON public.courses(major_id);
CREATE INDEX IF NOT EXISTS idx_courses_year_level_id ON public.courses(year_level_id);

CREATE INDEX IF NOT EXISTS idx_profiles_university_id ON public.profiles(university_id);
CREATE INDEX IF NOT EXISTS idx_profiles_college_id ON public.profiles(college_id);
CREATE INDEX IF NOT EXISTS idx_profiles_major_id ON public.profiles(major_id);
CREATE INDEX IF NOT EXISTS idx_profiles_year_level_id ON public.profiles(year_level_id);

CREATE INDEX IF NOT EXISTS idx_resources_course_id ON public.resources(course_id);
CREATE INDEX IF NOT EXISTS idx_resources_uploaded_by ON public.resources(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_folders_user_id ON public.folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON public.folders(parent_id);

CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_folder_id ON public.notes(folder_id);

CREATE INDEX IF NOT EXISTS idx_note_shares_shared_with_user_id ON public.note_shares(shared_with_user_id);

CREATE INDEX IF NOT EXISTS idx_note_tags_tag_id ON public.note_tags(tag_id);

CREATE INDEX IF NOT EXISTS idx_note_chunks_note_id ON public.note_chunks(note_id);
CREATE INDEX IF NOT EXISTS idx_embedding_jobs_note_id ON public.embedding_jobs(note_id);
CREATE INDEX IF NOT EXISTS idx_embedding_jobs_triggered_by ON public.embedding_jobs(triggered_by);
