import { AppShell } from "@/components/app-shell";
import { DashboardLayoutClient } from "@/components/dashboard-layout-client";

export default function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <DashboardLayoutClient>{children}</DashboardLayoutClient>
    </AppShell>
  );
}
