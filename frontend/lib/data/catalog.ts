import { createClient } from "@/lib/supabase/server";

export type University = {
  id: string;
  name_en: string;
  slug: string;
};

export type College = {
  id: string;
  university_id: string;
  name_en: string;
  slug: string;
};

export type Major = {
  id: string;
  college_id: string;
  name_en: string;
  slug: string;
  color: string | null;
  icon: string | null;
};

export type YearLevel = {
  id: string;
  level: number;
  name_en: string;
};

export type Course = {
  id: string;
  major_id: string;
  year_level_id: string | null;
  name_en: string;
  code: string | null;
  description: string | null;
  credits: number | null;
};

export type Doctor = {
  id: string;
  name_en: string;
};

export type Resource = {
  id: string;
  course_id: string;
  title_en: string;
  description: string | null;
  type: "lecture" | "exam" | "assignment" | "other";
  exam_type: "midterm" | "final" | "quiz" | null;
  doctor_id: string | null;
  google_drive_id: string;
  google_drive_url: string | null;
  file_type: string | null;
  file_size: number | null;
  download_count: number | null;
  view_count: number | null;
  average_rating: number | null;
  rating_count: number | null;
};

export async function getCatalogData() {
  const supabase = await createClient();

  const [universitiesRes, collegesRes, majorsRes, yearLevelsRes, coursesRes] =
    await Promise.all([
      supabase
        .from("universities")
        .select("id,name_en,slug")
        .eq("is_active", true)
        .order("name_en", { ascending: true }),
      supabase
        .from("colleges")
        .select("id,university_id,name_en,slug")
        .eq("is_active", true)
        .order("name_en", { ascending: true }),
      supabase
        .from("majors")
        .select("id,college_id,name_en,slug,color,icon")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name_en", { ascending: true }),
      supabase
        .from("year_levels")
        .select("id,level,name_en")
        .order("level", { ascending: true }),
      supabase
        .from("courses")
        .select("id,major_id,year_level_id,name_en,code,description,credits")
        .order("name_en", { ascending: true }),
    ]);

  if (universitiesRes.error) throw universitiesRes.error;
  if (collegesRes.error) throw collegesRes.error;
  if (majorsRes.error) throw majorsRes.error;
  if (yearLevelsRes.error) throw yearLevelsRes.error;
  if (coursesRes.error) throw coursesRes.error;

  return {
    universities: universitiesRes.data as University[],
    colleges: collegesRes.data as College[],
    majors: majorsRes.data as Major[],
    yearLevels: yearLevelsRes.data as YearLevel[],
    courses: coursesRes.data as Course[],
  };
}

export async function getCourseData(courseId: string) {
  const supabase = await createClient();

  const [courseRes, resourcesRes, doctorsRes, assignmentsRes] =
    await Promise.all([
      supabase
        .from("courses")
        .select("id,major_id,year_level_id,name_en,code,description,credits")
        .eq("id", courseId)
        .maybeSingle(),
      supabase
        .from("resources")
        .select(
          "id,course_id,title_en,type,exam_type,doctor_id,google_drive_id,google_drive_url,file_type,file_size,download_count,view_count,average_rating,rating_count",
        )
        .eq("course_id", courseId)
        .order("created_at", { ascending: false }),
      supabase
        .from("doctors")
        .select("id,name_en")
        .order("name_en", { ascending: true }),
      supabase
        .from("course_doctors")
        .select("doctor_id")
        .eq("course_id", courseId),
    ]);

  if (courseRes.error) throw courseRes.error;
  if (resourcesRes.error) throw resourcesRes.error;
  if (doctorsRes.error) throw doctorsRes.error;
  if (assignmentsRes.error) throw assignmentsRes.error;

  return {
    course: courseRes.data as Course | null,
    resources: resourcesRes.data as Resource[],
    doctors: doctorsRes.data as Doctor[],
    doctorAssignments: assignmentsRes.data as { doctor_id: string }[],
  };
}
