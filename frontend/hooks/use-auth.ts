"use client";

import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/neon/client";

export function useAuth() {
  return useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const { data, error } = await authClient.getSession();
      return error ? null : data?.user ?? null;
    },
  });
}
