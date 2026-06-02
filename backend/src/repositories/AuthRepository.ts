import type { SupabaseClient } from "@supabase/supabase-js";

export class AuthRepository {
  constructor(private supabase: SupabaseClient) {}

  async signUp(payload: any) {
    return this.supabase.auth.signUp(payload);
  }

  async signIn(payload: any) {
    return this.supabase.auth.signInWithPassword(payload);
  }

  async refresh(refreshToken: string) {
    return this.supabase.auth.refreshSession({ refresh_token: refreshToken });
  }
}
