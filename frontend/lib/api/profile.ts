import { apiRequest } from "@/lib/api/client";

export type CurrentProfile = {
  id: string;
  name: string | null;
  role: "admin" | "user";
  is_verified: boolean;
  verified_at: string | null;
  verification_requested_at: string | null;
  preferred_language: "en" | "ar";
};

export function getCurrentProfile(accessToken: string) {
  return apiRequest<{ profile: CurrentProfile | null }>("/api/profile/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function requestVerification(accessToken: string) {
  return apiRequest<{ profile: CurrentProfile }>(
    "/api/profile/request-verification",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
}
