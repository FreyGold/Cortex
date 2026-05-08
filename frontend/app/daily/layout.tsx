import { AppShell } from "@/components/app-shell";
import { DailyLayoutClient } from "@/components/daily/daily-layout-client";

export default function DailyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <DailyLayoutClient>{children}</DailyLayoutClient>
    </AppShell>
  );
}
