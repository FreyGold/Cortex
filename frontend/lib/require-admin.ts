import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";

export async function requireAdmin() {
  const session = await getServerSession();
  if (!session) redirect("/auth/login?redirectTo=/admin");
  if (session.profile.role !== "admin") redirect("/notes");
  return { user: session.user, profile: session.profile };
}
