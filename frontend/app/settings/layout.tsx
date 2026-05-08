import { AppShell } from "@/components/app-shell";
import { SettingsLayoutClient } from "@/components/settings/settings-layout-client";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <SettingsLayoutClient>{children}</SettingsLayoutClient>
    </AppShell>
  );
}
