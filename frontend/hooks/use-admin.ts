"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listAdminUsers, verifyAdminUser } from "@/lib/api/admin";
import { getAccessToken as getNeonAccessToken } from "@/lib/neon/client";

async function getAccessToken() {
  const token = await getNeonAccessToken();
  if (!token) throw new Error("You must be signed in to use admin features.");
  return token;
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
