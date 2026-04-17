import { getTranslations } from "next-intl/server";
import { NotesDashboard } from "@/components/notes/notes-dashboard";

export default async function NotesPage() {
  const t = await getTranslations("notesPage");

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </header>
      <NotesDashboard />
    </div>
  );
}
