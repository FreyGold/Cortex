import type { SupabaseClient } from "@supabase/supabase-js";

export class DataRepository {
  constructor(private supabase: SupabaseClient) {}

  async getUniversities() {
    const { data, error } = await this.supabase
      .from("universities")
      .select("id,name_en,slug")
      .eq("is_active", true)
      .order("name_en", { ascending: true });
    if (error) throw error;
    return data;
  }

  async getColleges() {
    const { data, error } = await this.supabase
      .from("colleges")
      .select("id,university_id,name_en,slug")
      .eq("is_active", true)
      .order("name_en", { ascending: true });
    if (error) throw error;
    return data;
  }

  async getMajors() {
    const { data, error } = await this.supabase
      .from("majors")
      .select("id,college_id,name_en,slug,color,icon")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name_en", { ascending: true });
    if (error) throw error;
    return data;
  }

  async getYearLevels() {
    const { data, error } = await this.supabase
      .from("year_levels")
      .select("id,level,name_en")
      .order("level", { ascending: true });
    if (error) throw error;
    return data;
  }

  async getCourses() {
    const { data, error } = await this.supabase
      .from("courses")
      .select("id,major_id,year_level_id,name_en,code,description,credits")
      .order("name_en", { ascending: true });
    if (error) throw error;
    return data;
  }

  async getCourse(courseId: string) {
    const { data, error } = await this.supabase
      .from("courses")
      .select("id,major_id,year_level_id,name_en,code,description,credits")
      .eq("id", courseId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async getResources(courseId: string) {
    const { data, error } = await this.supabase
      .from("resources")
      .select(
        "id,course_id,title_en,type,exam_type,doctor_id,google_drive_id,google_drive_url,note_id,file_type,file_size,download_count,view_count,average_rating,rating_count"
      )
      .eq("course_id", courseId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  }

  async getDoctors() {
    const { data, error } = await this.supabase
      .from("doctors")
      .select("id,name_en")
      .order("name_en", { ascending: true });
    if (error) throw error;
    return data;
  }

  async getCourseDoctors(courseId: string) {
    const { data, error } = await this.supabase
      .from("course_doctors")
      .select("doctor_id")
      .eq("course_id", courseId);
    if (error) throw error;
    return data;
  }

  async assignDoctorToCourse(courseId: string, doctorId: string) {
    const { error } = await this.supabase
      .from("course_doctors")
      .upsert({ course_id: courseId, doctor_id: doctorId }, { onConflict: "course_id,doctor_id", ignoreDuplicates: true });
    if (error) throw error;
  }

  async unassignDoctorFromCourse(courseId: string, doctorId: string) {
    const { error } = await this.supabase
      .from("course_doctors")
      .delete()
      .eq("course_id", courseId)
      .eq("doctor_id", doctorId);
    if (error) throw error;
  }

  async createDoctor(name_en: string) {
    const { data, error } = await this.supabase
      .from("doctors")
      .insert({ name_en })
      .select();
    if (error) throw error;
    if (!data || data.length === 0) throw new Error("Failed to create instructor.");
    return data[0];
  }

  async createCourse(payload: any) {
    const { data, error } = await this.supabase
      .from("courses")
      .insert(payload)
      .select("id,major_id,name_en,code");
    if (error) throw error;
    if (!data || data.length === 0) throw new Error("Failed to create course. Ensure you have admin permissions.");
    return data[0];
  }

  async updateCourse(courseId: string, updates: any) {
    const { data, error } = await this.supabase
      .from("courses")
      .update(updates)
      .eq("id", courseId)
      .select();
    if (error) throw error;
    if (!data || data.length === 0) throw new Error("Course not found or permission denied.");
    return data[0];
  }

  async createResource(payload: any) {
    const { data, error } = await this.supabase
      .from("resources")
      .insert(payload)
      .select();
    if (error) throw error;
    if (!data || data.length === 0) throw new Error("Failed to create resource. Ensure you are verified or an admin.");
    return data[0];
  }

  async updateResource(resourceId: string, updates: any) {
    const { data, error } = await this.supabase
      .from("resources")
      .update(updates)
      .eq("id", resourceId)
      .select();
    
    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error("Resource not found or you don't have permission to update it.");
    }
    return data[0];
  }

  async deleteResource(resourceId: string) {
    const { error } = await this.supabase
      .from("resources")
      .delete()
      .eq("id", resourceId);
    if (error) throw error;
  }
}
