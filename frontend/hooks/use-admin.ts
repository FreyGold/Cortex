"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listAdminUsers, verifyAdminUser } from "@/lib/api/admin";
import { createClient } from "@/lib/supabase/client";

async function getAccessToken() {
  const supabase = createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new Error("You must be signed in to use admin features.");
  }

  return session.access_token;
}

export function useAdminUsers(query: string) {
  return useQuery({
    queryKey: ["admin-users", query],
    queryFn: async () => {
      const accessToken = await getAccessToken();
      return listAdminUsers(accessToken, query, 50);
    },
  });
}

export function useVerifyAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { userId: string; isVerified: boolean }) => {
      const accessToken = await getAccessToken();
      return verifyAdminUser(accessToken, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}
