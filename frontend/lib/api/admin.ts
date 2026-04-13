import { apiRequest } from "@/lib/api/client";

export type AdminUser = {
  id: string;
  name: string | null;
  role: "admin" | "user";
  is_verified: boolean;
  verified_at: string | null;
  preferred_language: "en" | "ar";
  created_at: string;
};

export function listAdminUsers(accessToken: string, query?: string, limit = 50) {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  if (query?.trim()) {
    params.set("query", query.trim());
  }

  return apiRequest<{ users: AdminUser[] }>(`/api/admin/users?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function verifyAdminUser(
  accessToken: string,
  input: { userId: string; isVerified: boolean },
) {
  return apiRequest<{ profile: AdminUser }>("/api/admin/verify-user", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: input,
  });
}
