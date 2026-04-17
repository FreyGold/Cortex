"use client";

import { GoogleLogo } from "@phosphor-icons/react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <Card className="w-full max-w-sm shadow-none">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-bold">
          {isSignup ? t("signUpTitle") : t("signInTitle")}
        </CardTitle>
        <CardDescription>
          {isSignup ? t("signUpSubtitle") : t("signInSubtitle")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          {isSignup ? (
            <div className="space-y-1.5">
              <Label htmlFor="fullName">{t("fullName")}</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder={t("placeholders.fullName")}
                required
              />
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("placeholders.email")}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">{t("password")}</Label>
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
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
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

          {error ? <p className="text-xs text-destructive">{error}</p> : null}
          {message ? (
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              {message}
            </p>
          ) : null}

          <Button className="w-full" type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isSignup ? t("signUp") : t("signIn")}
          </Button>

          {!isSignup ? (
            <Button
              className="w-full"
              type="button"
              variant="outline"
              onClick={loginWithGoogle}
              disabled={loading}
            >
              <GoogleLogo className="mr-2 size-4" />
              {t("continueWithGoogle")}
            </Button>
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
      </CardContent>
    </Card>
  );
}
