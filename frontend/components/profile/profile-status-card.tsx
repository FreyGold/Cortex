"use client";

import {
  ArrowRight,
  CheckCircle,
  HourglassLow,
  SealCheck,
} from "@phosphor-icons/react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useMessages } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCurrentProfile, useRequestVerification } from "@/hooks/use-profile";
import { getMessage } from "@/lib/messages";

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ProfileStatusCard() {
  const messages = useMessages();
  const { data, isLoading, isError, error } = useCurrentProfile();
  const requestVerification = useRequestVerification();
  const profile = data?.profile;

  if (isLoading) {
    return (
      <Card className="shadow-none border-border/60">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="shadow-none border-border/60">
        <CardContent className="py-10 text-center">
          <p className="text-sm font-medium text-destructive">
            {(error as Error).message}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className="shadow-none border-border/60">
        <CardHeader>
          <CardTitle className="text-xl font-bold">
            {getMessage(
              messages,
              "profilePage.verification.title",
              "Verification status",
            )}
          </CardTitle>
          <CardDescription>
            {getMessage(
              messages,
              "profilePage.verification.missing",
              "We could not find a profile record for this account.",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="secondary">
            <Link href="/profile/setup">
              {getMessage(
                messages,
                "profilePage.verification.editSetup",
                "Edit academic setup",
              )}
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const verified = profile.is_verified;
  const requestedAt = profile.verification_requested_at;
  const statusLabel = verified
    ? getMessage(messages, "profilePage.verification.verified", "Verified")
    : requestedAt
      ? getMessage(messages, "profilePage.verification.requested", "Requested")
      : getMessage(
          messages,
          "profilePage.verification.pending",
          "Pending review",
        );
  const statusVariant = verified ? "success" : requestedAt ? "axon" : "outline";
  const canRequest =
    !verified && !requestedAt && !requestVerification.isPending;

  return (
    <Card className="shadow-none border-border/60">
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <SealCheck className="size-5" weight="duotone" />
          <span className="text-[10px] font-bold uppercase tracking-wider">
            {getMessage(
              messages,
              "profilePage.verification.title",
              "Verification status",
            )}
          </span>
        </div>
        <CardTitle className="text-xl font-bold">
          {getMessage(
            messages,
            "profilePage.overviewTitle",
            "Profile overview",
          )}
        </CardTitle>
        <CardDescription>
          {getMessage(
            messages,
            "profilePage.verification.hint",
            "Admins review verification requests after your academic details are complete.",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={statusVariant}
            className="h-6 px-2 text-[10px] uppercase"
          >
            {statusLabel}
          </Badge>
          {verified && profile.verified_at ? (
            <span className="text-xs text-muted-foreground">
              {getMessage(
                messages,
                "profilePage.verification.verifiedAt",
                "Verified {date}",
                {
                  date: formatDate(profile.verified_at),
                },
              )}
            </span>
          ) : requestedAt ? (
            <span className="text-xs text-muted-foreground">
              {getMessage(
                messages,
                "profilePage.verification.requestedAt",
                "Requested {date}",
                {
                  date: formatDate(requestedAt),
                },
              )}
            </span>
          ) : null}
        </div>

        {!verified && !requestedAt ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <HourglassLow className="size-4" />
            {getMessage(
              messages,
              "profilePage.verification.pendingDescription",
              "Your profile is ready. Request verification when you want an admin to review it.",
            )}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => requestVerification.mutate()}
            disabled={!canRequest}
            className="gap-2"
          >
            {requestVerification.isPending && (
              <Loader2 className="size-4 animate-spin" />
            )}
            {verified
              ? getMessage(
                  messages,
                  "profilePage.verification.verified",
                  "Verified",
                )
              : requestedAt
                ? getMessage(
                    messages,
                    "profilePage.verification.requested",
                    "Requested",
                  )
                : getMessage(
                    messages,
                    "profilePage.verification.request",
                    "Request verification",
                  )}
          </Button>
          <Button asChild variant="secondary">
            <Link href="/profile/setup">
              {getMessage(
                messages,
                "profilePage.verification.editSetup",
                "Edit academic setup",
              )}
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>

        {requestVerification.isSuccess ? (
          <p className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="size-4" />
            {getMessage(
              messages,
              "profilePage.verification.success",
              "Verification request sent.",
            )}
          </p>
        ) : null}

        {requestVerification.isError ? (
          <p className="text-sm text-destructive">
            {(requestVerification.error as Error).message}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
