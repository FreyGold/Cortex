import type { SupabaseClient } from "@supabase/supabase-js";

export class AdminRepository {
  constructor(private supabase: SupabaseClient) {}

  async getUsers(query: string, limit: number) {
    let statement = this.supabase
      .from("profiles")
      .select(
        "id,name,email,role,is_verified,verified_at,verification_requested_at,preferred_language,created_at",
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (query) {
      statement = statement.or(`name.ilike.%${query}%,email.ilike.%${query}%`);
    }

    const { data, error } = await statement;
    if (error) throw error;
    return data;
  }

  async verifyUser(userId: string, isVerified: boolean, verifiedBy: string) {
    const nowIso = new Date().toISOString();
    const { data, error } = await this.supabase
      .from("profiles")
      .update({
        is_verified: isVerified,
        verified_at: isVerified ? nowIso : null,
        verified_by: isVerified ? verifiedBy : null,
        verification_requested_at: null,
      })
      .eq("id", userId)
      .select("id,is_verified,verified_at,verified_by,verification_requested_at")
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async createUniversity(payload: any) {
    const { data, error } = await this.supabase
      .from("universities")
      .insert(payload)
      .select("id,name_en,slug");
    if (error) throw error;
    if (!data || data.length === 0) throw new Error("Failed to create university.");
    return data[0];
  }

  async createCollege(payload: any) {
    const { data, error } = await this.supabase
      .from("colleges")
      .insert(payload)
      .select("id,university_id,name_en,slug");
    if (error) throw error;
    if (!data || data.length === 0) throw new Error("Failed to create college.");
    return data[0];
  }

  async createMajor(payload: any) {
    const { data, error } = await this.supabase
      .from("majors")
      .insert(payload)
      .select("id,college_id,name_en,slug");
    if (error) throw error;
    if (!data || data.length === 0) throw new Error("Failed to create major.");
    return data[0];
  }

  async createCourse(payload: any) {
    const { data, error } = await this.supabase
      .from("courses")
      .insert(payload)
      .select("id,major_id,name_en,code");
    if (error) throw error;
    if (!data || data.length === 0) throw new Error("Failed to create course.");
    return data[0];
  }

  async seedYearLevels(payload: any[]) {
    const { error } = await this.supabase
      .from("year_levels")
      .upsert(payload, { onConflict: "level" });
    if (error) throw error;
  }
}
