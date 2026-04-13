import { AppShell } from "@/components/app-shell";
import { NoteEditorPage } from "@/components/notes/note-editor-page";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function NoteDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <AppShell>
      <main className="container mx-auto space-y-6 px-4 py-8">
        <NoteEditorPage noteId={id} />
      </main>
    </AppShell>
  );
}
