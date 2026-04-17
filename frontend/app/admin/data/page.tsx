import { DataManager } from "@/components/admin/data-manager";
import { AppShell } from "@/components/app-shell";
import { requireAdmin } from "@/lib/require-admin";

export default async function AdminDataPage() {
  await requireAdmin();

  return (
    <AppShell>
      <main className="container mx-auto space-y-6 px-4 py-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Academic data management
          </h1>
          <p className="text-muted-foreground">
            Add and maintain catalog entities for universities and colleges.
          </p>
        </header>
        <DataManager />
      </main>
    </AppShell>
  );
}
