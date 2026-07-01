import { AppShell } from "@/components/app-shell";
import { DashboardLayoutClient } from "@/components/dashboard-layout-client";

export default function SettingsLayout({
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
