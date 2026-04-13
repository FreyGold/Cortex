"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CortexButton } from "@/components/ui/cortex-button";
import { Input } from "@/components/ui/input";
import {
  useLoginMutation,
  useSignupMutation,
} from "@/hooks/use-auth-mutations";
import type { ApiError } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

type Props = {
  mode: Mode;
};

export function AuthForm({ mode }: Props) {
  const t = useTranslations("auth");
  const router = useRouter();
  const supabase = createClient();
  const loginMutation = useLoginMutation();
  const signupMutation = useSignupMutation();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [oauthLoading, setOauthLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSignup = mode === "signup";

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (isSignup && password !== confirmPassword) {
      setError(t("errors.passwordMismatch"));
      return;
    }

    const payload = await (isSignup
      ? signupMutation.mutateAsync({ fullName, email, password })
      : loginMutation.mutateAsync({ email, password })
    ).catch((mutationError) => {
      const apiError = mutationError as ApiError;
      setError(apiError.message ?? t("errors.unknown"));
      return null;
    });

    if (!payload) return;

    if (payload.session) {
      const { error: setSessionError } = await supabase.auth.setSession({
        access_token: payload.session.access_token,
        refresh_token: payload.session.refresh_token,
      });

      if (setSessionError) {
        setError(setSessionError.message);
        return;
      }

      router.push("/data");
      router.refresh();
      return;
    }

    setMessage(payload.message ?? t("messages.checkEmail"));
  };

  const loginWithGoogle = async () => {
    setOauthLoading(true);
    setMessage(null);
    setError(null);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (oauthError) {
      setOauthLoading(false);
      setError(oauthError.message);
    }
  };

  const loading =
    loginMutation.isPending || signupMutation.isPending || oauthLoading;

  return (
    <div className="mx-auto w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-card">
      <h1 className="mb-1 text-2xl font-semibold">
        {isSignup ? t("signUpTitle") : t("signInTitle")}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {isSignup ? t("signUpSubtitle") : t("signInSubtitle")}
      </p>

      <form onSubmit={submit} className="space-y-4">
        {isSignup ? (
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="fullName">
              {t("fullName")}
            </label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder={t("placeholders.fullName")}
              required
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="email">
            {t("email")}
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t("placeholders.email")}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="password">
            {t("password")}
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={t("placeholders.password")}
            required
          />
        </div>

        {isSignup ? (
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="confirmPassword">
              {t("confirmPassword")}
            </label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder={t("placeholders.confirmPassword")}
              required
            />
          </div>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {message ? (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            {message}
          </p>
        ) : null}

        <CortexButton className="w-full" type="submit" loading={loading}>
          {isSignup ? t("signUp") : t("signIn")}
        </CortexButton>

        {!isSignup ? (
          <CortexButton
            className="w-full"
            type="button"
            variant="secondary"
            onClick={loginWithGoogle}
            loading={loading}
          >
            {t("continueWithGoogle")}
          </CortexButton>
        ) : null}
      </form>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        {isSignup ? t("haveAccount") : t("noAccount")}{" "}
        <Link
          className="font-medium text-primary hover:underline"
          href={isSignup ? "/auth/login" : "/auth/signup"}
        >
          {isSignup ? t("signIn") : t("signUp")}
        </Link>
      </div>

      {!isSignup ? (
        <div className="mt-3 text-center text-sm">
          <Link
            className="font-medium text-primary hover:underline"
            href="/auth/logout"
          >
            {t("signOut")}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
