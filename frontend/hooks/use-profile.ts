"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import {
  type CurrentProfile,
  getCurrentProfile,
  requestVerification,
} from "@/lib/api/profile";
import { createClient } from "@/lib/supabase/client";

async function getAccessToken() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("You must be signed in to access your profile.");
  }

  return session.access_token;
}

export function useCurrentProfile() {
  return useQuery({
    queryKey: ["current-profile"],
    queryFn: async () => {
      const accessToken = await getAccessToken();
      try {
        const { profile } = await getCurrentProfile(accessToken);
        return { profile: profile as CurrentProfile | null };
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return { profile: null };
        }
        throw error;
      }
    },
  });
}

export function useRequestVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const accessToken = await getAccessToken();
      await requestVerification(accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-profile"] });
    },
  });
}
