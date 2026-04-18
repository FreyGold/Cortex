import type { SupabaseClient } from "@supabase/supabase-js";

export class ProfileRepository {
  constructor(private supabase: SupabaseClient) {}

  async getProfile(userId: string) {
    const { data, error } = await this.supabase
      .from("profiles")
      .select(
        "id,name,role,is_verified,verified_at,verification_requested_at,preferred_language,university_id,college_id,major_id,year_level_id",
      )
      .eq("id", userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async updateProfile(userId: string, updates: Record<string, any>) {
    const { error } = await this.supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId);
    if (error) throw error;
  }

  async getVerificationStatus(userId: string) {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("id,is_verified,verification_requested_at")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async requestVerification(userId: string, nowIso: string) {
    const { data, error } = await this.supabase
      .from("profiles")
      .update({ verification_requested_at: nowIso })
      .eq("id", userId)
      .eq("is_verified", false)
      .is("verification_requested_at", null)
      .select(
        "id,name,role,is_verified,verified_at,verification_requested_at,preferred_language",
      )
      .maybeSingle();
    if (error) throw error;
    return data;
  }
}
