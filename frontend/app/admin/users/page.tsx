import { UsersManager } from "@/components/admin/users-manager";
import { AppShell } from "@/components/app-shell";
import { requireAdmin } from "@/lib/require-admin";

export default async function AdminUsersPage() {
  await requireAdmin();

  return (
    <AppShell>
      <main className="container mx-auto space-y-6 px-4 py-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">User management</h1>
          <p className="text-muted-foreground">
            Verify users and monitor account readiness.
          </p>
        </header>
        <UsersManager />
      </main>
    </AppShell>
  );
}
