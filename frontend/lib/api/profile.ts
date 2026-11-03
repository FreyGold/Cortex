import { apiRequest } from "@/lib/api/client";

export type CurrentProfile = {
  id: string;
  name: string | null;
  avatar_url: string | null;
  role: "admin" | "user";
  is_verified: boolean;
  verified_at: string | null;
  verification_requested_at: string | null;
  preferred_language: "en" | "ar";
  university_id: string | null;
  college_id: string | null;
  major_id: string | null;
  year_level_id: string | null;
};

export function getCurrentProfile(accessToken: string) {
  return apiRequest<{ profile: CurrentProfile | null }>("/api/profile/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function setupProfile(
  accessToken: string,
  payload: {
    universityId: string | null;
    collegeId: string | null;
    majorId: string | null;
    yearLevelId: string | null;
    preferredLanguage: "en" | "ar";
  },
) {
  return apiRequest<{ success: boolean }>("/api/profile/setup", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: payload,
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
