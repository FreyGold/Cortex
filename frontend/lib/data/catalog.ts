import { apiRequest } from "@/lib/api/client";

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
  type: "lecture" | "exam" | "assignment" | "note" | "other";
  exam_type: "midterm" | "final" | "quiz" | null;
  doctor_id: string | null;
  google_drive_id: string | null;
  google_drive_url: string | null;
  note_id: string | null;
  file_type: string | null;
  file_size: number | null;
  download_count: number | null;
  view_count: number | null;
  average_rating: number | null;
  rating_count: number | null;
};

export async function getCatalogData() {
  return apiRequest<{
    universities: University[];
    colleges: College[];
    majors: Major[];
    yearLevels: YearLevel[];
    courses: Course[];
  }>("/api/data/catalog");
}

export async function getCourseData(courseId: string) {
  return apiRequest<{
    course: Course | null;
    resources: Resource[];
    doctors: Doctor[];
    doctorAssignments: { doctor_id: string }[];
  }>(`/api/data/courses/${courseId}`);
}

export async function createDoctor(accessToken: string, name_en: string) {
  return apiRequest<{ doctor: Doctor }>("/api/data/doctors", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: { name_en },
  });
}
