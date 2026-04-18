import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "./api/profile";

export async function getServerSession() {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return null;
    }

    // Call our backend to verify the token and get the profile.
    // The backend will perform the secure getUser() check and return the verified profile.
    const { profile } = await getCurrentProfile(session.access_token);
    
    if (!profile) {
      return null;
    }

    return {
      user: session.user,
      profile,
      accessToken: session.access_token,
    };
  } catch (error) {
    return null;
  }
}
