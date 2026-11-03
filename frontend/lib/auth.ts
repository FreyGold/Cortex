import { auth } from "@/lib/neon/server";
import { getCurrentProfile } from "./api/profile";

export async function getServerAccessToken() {
  const getToken = auth.token as () => Promise<{ data: { token: string } | null; error: unknown }>;
  const { data, error } = await getToken();
  return error ? null : data?.token ?? null;
}

export async function getServerSession() {
  try {
    const [{ data }, accessToken] = await Promise.all([auth.getSession(), getServerAccessToken()]);
    if (!data?.user || !accessToken) return null;
    const { profile } = await getCurrentProfile(accessToken);
    if (!profile) return null;
    return { user: data.user, profile, accessToken };
  } catch {
    return null;
  }
}
