-- 012_add_menofia_data.sql
-- This migration adds Menofia University, its Faculty of Electronic Engineering, and its majors.
-- It also expands year_levels to include Level 0 (Preparatory) and adds initial graduation project data.

-- 1. Adjust year_levels check constraint to allow Level 0
ALTER TABLE public.year_levels DROP CONSTRAINT IF EXISTS year_levels_level_check;
ALTER TABLE public.year_levels ADD CONSTRAINT year_levels_level_check CHECK (level BETWEEN 0 AND 6);

-- 2. Insert Year Levels (0 to 4)
INSERT INTO public.year_levels (level, name_en, name_ar)
VALUES 
  (0, 'Preparatory Year', 'الفرقة الإعدادية'),
  (1, 'First Year', 'الفرقة الأولى'),
  (2, 'Second Year', 'الفرقة الثانية'),
  (3, 'Third Year', 'الفرقة الثالثة'),
  (4, 'Fourth Year', 'الفرقة الرابعة')
ON CONFLICT (level) DO UPDATE SET 
  name_en = EXCLUDED.name_en,
  name_ar = EXCLUDED.name_ar;

-- 3. Insert Menofia University
INSERT INTO public.universities (name_en, name_ar, slug, country, city)
VALUES ('Menofia University', 'جامعة المنوفية', 'menofia', 'Egypt', 'Menofia')
ON CONFLICT (slug) DO NOTHING;

-- 4. Insert Faculty of Electronic Engineering
INSERT INTO public.colleges (university_id, name_en, name_ar, slug)
SELECT 
  id as university_id, 
  'Faculty of Electronic Engineering', 
  'كلية الهندسة الإلكترونية بمنوف', 
  'faculty-electronic-engineering'
FROM public.universities 
WHERE slug = 'menofia'
ON CONFLICT (university_id, slug) DO NOTHING;

-- 5. Insert Majors (Automation, Computer Science, Communication)
WITH fee_college AS (
  SELECT id FROM public.colleges WHERE slug = 'faculty-electronic-engineering'
)
INSERT INTO public.majors (college_id, name_en, slug, color, icon)
SELECT fee_college.id, 'Automation and Industrial Electronics', 'automation', '#10b981', 'cpu' FROM fee_college
UNION ALL
SELECT fee_college.id, 'Computer Science and Engineering', 'computer-science', '#3b82f6', 'code' FROM fee_college
UNION ALL
SELECT fee_college.id, 'Communications and Electronics Engineering', 'communication', '#f59e0b', 'broadcast' FROM fee_college
ON CONFLICT (college_id, slug) DO NOTHING;

-- 6. Add a Course for Graduation Project (Level 4)
-- Since majors were just added, we'll add the course to each of the relevant majors at Level 4.
INSERT INTO public.courses (major_id, year_level_id, name_en, name_ar, code, description)
SELECT 
  m.id as major_id,
  yl.id as year_level_id,
  'Graduation Project II',
  'مشروع التخرج 2',
  'GP402',
  'Materials and resources for the graduation project, second semester.'
FROM public.majors m
JOIN public.colleges c ON m.college_id = c.id
JOIN public.year_levels yl ON yl.level = 4
WHERE c.slug = 'faculty-electronic-engineering'
  AND m.slug IN ('automation', 'computer-science', 'communication')
ON CONFLICT (major_id, code) DO NOTHING;

-- 7. Add the Google Drive Folder as a resource
-- Note: Requires an admin profile to exist for 'uploaded_by'. 
-- We'll try to find an admin or create a system user if needed.
DO $$
DECLARE
  v_admin_id UUID;
  v_course_id UUID;
BEGIN
  -- Try to find an existing admin
  SELECT id INTO v_admin_id FROM public.profiles WHERE role = 'admin' LIMIT 1;
  
  -- If no admin, find the first available user
  IF v_admin_id IS NULL THEN
    SELECT id INTO v_admin_id FROM public.profiles LIMIT 1;
  END IF;
  
  -- If still no user, we can't insert the resource without violating the NOT NULL constraint
  -- In a real scenario, we might want to create a system user here, but for now we skip if no user exists.
  IF v_admin_id IS NOT NULL THEN
    FOR v_course_id IN 
      SELECT co.id 
      FROM public.courses co 
      JOIN public.majors m ON co.major_id = m.id
      JOIN public.colleges c ON m.college_id = c.id
      WHERE c.slug = 'faculty-electronic-engineering' AND co.code = 'GP402'
    LOOP
      INSERT INTO public.resources (
        course_id, 
        uploaded_by, 
        title_en, 
        title_ar, 
        type, 
        google_drive_id, 
        google_drive_url, 
        description
      )
      VALUES (
        v_course_id,
        v_admin_id,
        'Graduation Project Folder (Second Semester)',
        'مجلد مشروع التخرج (الفصل الدراسي الثاني)',
        'other',
        '1y0vGWJ0M_pDH_JIT0knvDz6i6K0S3qpi',
        'https://drive.google.com/drive/u/0/folders/1y0vGWJ0M_pDH_JIT0knvDz6i6K0S3qpi',
        'Complete collection of materials for the second semester of the graduation project.'
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
END $$;
