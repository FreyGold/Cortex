"use client";

import { createAuthClient } from "@neon/auth/next";

export const authClient = createAuthClient();

export async function getAccessToken() {
  const { data, error } = await authClient.token({ fetchOptions: { headers: { "X-Force-Fetch": "true" } } });
  return error ? null : data?.token ?? null;
}

export async function getUserId() {
  const { data, error } = await authClient.getSession();
  return error ? null : data?.user?.id ?? null;
}
