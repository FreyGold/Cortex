"use client";

import type React from "react";
import { ClientOnly } from "./client-only";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <ClientOnly>
      <div className="flex bg-background relative min-h-screen overflow-hidden">
        {children}
      </div>
    </ClientOnly>
  );
}
