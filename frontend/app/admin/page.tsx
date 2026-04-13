import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import {
  CortexCard,
  CortexCardContent,
  CortexCardDescription,
  CortexCardHeader,
  CortexCardTitle,
} from "@/components/ui/cortex-card";

export default function AdminPage() {
  return (
    <AppShell>
      <main className="container mx-auto space-y-6 px-4 py-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Admin dashboard</h1>
          <p className="text-muted-foreground">
            Manage users and academic catalog entities.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/admin/users">
            <CortexCard className="h-full transition-transform hover:-translate-y-0.5">
              <CortexCardHeader>
                <CortexCardTitle>User management</CortexCardTitle>
                <CortexCardDescription>
                  Review and verify student accounts.
                </CortexCardDescription>
              </CortexCardHeader>
              <CortexCardContent className="text-sm font-semibold text-primary">
                Open users →
              </CortexCardContent>
            </CortexCard>
          </Link>
          <Link href="/admin/data">
            <CortexCard className="h-full transition-transform hover:-translate-y-0.5">
              <CortexCardHeader>
                <CortexCardTitle>Data management</CortexCardTitle>
                <CortexCardDescription>
                  Maintain universities, colleges, majors, and courses.
                </CortexCardDescription>
              </CortexCardHeader>
              <CortexCardContent className="text-sm font-semibold text-primary">
                Open data tools →
              </CortexCardContent>
            </CortexCard>
          </Link>
        </div>
      </main>
    </AppShell>
  );
}
