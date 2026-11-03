"use client";

import { Globe as GoogleLogo, Loader2 } from "lucide-react";
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
import { authClient } from "@/lib/neon/client";

type Mode = "login" | "signup";

type Props = {
  mode: Mode;
};

export function AuthForm({ mode }: Props) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

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

    setSubmitting(true);
    try {
      const result = isSignup
        ? await authClient.signUp.email({ name: fullName, email, password })
        : await authClient.signIn.email({ email, password });
      if (result.error) {
        setError(result.error.message ?? t("errors.unknown"));
        return;
      }
      const { data } = await authClient.getSession();
      if (!data?.user) {
        setMessage(t("messages.checkEmail"));
        return;
      }
      const target = new URLSearchParams(window.location.search).get("redirectTo");
      let destination = "/data";
      if (target?.startsWith("/") && !target.startsWith("//")) {
        const url = new URL(target, window.location.origin);
        if (url.origin === window.location.origin) destination = url.pathname + url.search + url.hash;
      }
      router.push(destination);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : t("errors.unknown"));
    } finally {
      setSubmitting(false);
    }
  };

  const loginWithGoogle = async () => {
    setOauthLoading(true);
    setMessage(null);
    setError(null);
    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: `${window.location.origin}/data`,
      });
      if (error) {
        setOauthLoading(false);
        setError(error.message ?? t("errors.unknown"));
      }
    } catch (error) {
      setOauthLoading(false);
      setError(error instanceof Error ? error.message : t("errors.unknown"));
    }
  };

  const loading =
    submitting || oauthLoading;

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

          {!isSignup && process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "true" ? (
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
