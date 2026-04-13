"use client";

import { useMutation } from "@tanstack/react-query";
import {
  type LoginInput,
  login,
  type SignupInput,
  signup,
} from "@/lib/api/auth";

export function useLoginMutation() {
  return useMutation({
    mutationKey: ["auth", "login"],
    mutationFn: (input: LoginInput) => login(input),
  });
}

export function useSignupMutation() {
  return useMutation({
    mutationKey: ["auth", "signup"],
    mutationFn: (input: SignupInput) => signup(input),
  });
}
