-- 019_auto_assign_course_doctors.sql

-- Function to automatically assign a doctor to a course when a resource is added/updated with a doctor
CREATE OR REPLACE FUNCTION public.tr_resources_doctor_assignment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.doctor_id IS NOT NULL THEN
    INSERT INTO public.course_doctors (course_id, doctor_id)
    VALUES (NEW.course_id, NEW.doctor_id)
    ON CONFLICT (course_id, doctor_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for inserting or updating resources
DROP TRIGGER IF EXISTS tr_resources_doctor_assignment_trigger ON public.resources;
CREATE TRIGGER tr_resources_doctor_assignment_trigger
  AFTER INSERT OR UPDATE OF doctor_id ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.tr_resources_doctor_assignment();
