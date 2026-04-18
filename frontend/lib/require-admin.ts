import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/api/profile";

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirectTo=/admin");
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    redirect("/auth/login?redirectTo=/admin");
  }

  let profile = null;
  try {
    const res = await getCurrentProfile(session.access_token);
    profile = res.profile;
  } catch (error: any) {
    throw new Error(`Failed to load profile role: ${error.message}`);
  }

  if (!profile || profile.role !== "admin") {
    redirect("/notes");
  }

  return { supabase, user, profile };
}
