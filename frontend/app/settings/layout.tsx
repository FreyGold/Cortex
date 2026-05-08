import { AppShell } from "@/components/app-shell";
import { NotesLayoutClient } from "@/components/notes/notes-layout-client";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <NotesLayoutClient>{children}</NotesLayoutClient>
    </AppShell>
  );
}
