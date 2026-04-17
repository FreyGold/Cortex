"use client";

import { SignOut, Sparkle } from "@phosphor-icons/react";
import Link from "next/link";
import { useMessages } from "next-intl";
import { useState } from "react";
import { GeneralAiDrawer } from "@/components/ai/general-ai-drawer";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { getMessage } from "@/lib/messages";

type ShellHeaderActionsProps = {
  signedIn: boolean;
  authLabel: string;
};

export function ShellHeaderActions({
  signedIn,
  authLabel,
}: ShellHeaderActionsProps) {
  const messages = useMessages();
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="hidden gap-1.5 md:inline-flex"
        onClick={() => setAiOpen(true)}
      >
        <Sparkle className="size-3.5" weight="fill" />
        {getMessage(messages, "shell.ai.open", "Ask AI")}
      </Button>
      <ThemeToggle />
      <LanguageSwitcher />
      <Link href={signedIn ? "/auth/logout" : "/auth/login"}>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          {signedIn ? <SignOut className="size-3.5" /> : null}
          <span className="hidden sm:inline">{authLabel}</span>
        </Button>
      </Link>
      <GeneralAiDrawer open={aiOpen} onOpenChange={setAiOpen} />
    </>
  );
}
