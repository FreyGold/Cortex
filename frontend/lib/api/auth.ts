import { apiRequest } from "@/lib/api/client";

type AuthSession = {
  access_token: string;
  refresh_token: string;
} | null;

type AuthResponse = {
  message?: string;
  error?: string;
  session?: AuthSession;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type SignupInput = LoginInput & {
  fullName: string;
};

export function login(input: LoginInput) {
  return apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: input,
  });
}

export function signup(input: SignupInput) {
  return apiRequest<AuthResponse>("/api/auth/signup", {
    method: "POST",
    body: input,
  });
}
