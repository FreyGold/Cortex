import { NoteEditorPage } from "@/components/notes/note-editor-page";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function NoteDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="min-w-0">
      <NoteEditorPage noteId={id} />
    </div>
  );
}
