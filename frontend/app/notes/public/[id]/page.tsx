import { PublicNoteView } from "@/components/notes/public-note-view";

export default async function PublicNotePage({ params }: { params: { id: string } }) {
  const { id } = await params;
  return <PublicNoteView noteId={id} />;
}
