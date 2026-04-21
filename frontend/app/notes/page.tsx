import { NotesDashboard } from "@/components/notes/notes-dashboard";

export default async function NotesPage() {
  return (
    <main className="p-6 md:p-12 overflow-y-auto h-full custom-scrollbar">
      <NotesDashboard />
    </main>
  );
}
