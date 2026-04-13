import { AppShell } from "@/components/app-shell";
import { NotesDashboard } from "@/components/notes/notes-dashboard";
import { getTranslations } from "next-intl/server";

export default async function NotesPage() {
  const t = await getTranslations("notesPage");

  return (
    <AppShell>
      <main className="container mx-auto space-y-6 px-4 py-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </header>
        <NotesDashboard />
      </main>
    </AppShell>
  );
}
