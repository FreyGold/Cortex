-- 018_fix_course_doctors_pk.sql

-- Drop the existing primary key that includes academic_year_id
ALTER TABLE public.course_doctors DROP CONSTRAINT IF EXISTS course_doctors_pkey;

-- Add a new primary key with only course_id and doctor_id
ALTER TABLE public.course_doctors ADD PRIMARY KEY (course_id, doctor_id);

-- Now we can drop the NOT NULL constraint on academic_year_id
ALTER TABLE public.course_doctors ALTER COLUMN academic_year_id DROP NOT NULL;