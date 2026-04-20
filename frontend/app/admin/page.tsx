import { ArrowRight, Database, Users } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireAdmin } from "@/lib/require-admin";

export default async function AdminPage() {
  await requireAdmin();

  return (
    <AppShell>
      <main className="container mx-auto max-w-4xl space-y-8 px-4 py-10 md:py-16">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your academic platform's core data and user community.
          </p>
        </header>

        <Separator />

        <div className="grid gap-6 md:grid-cols-2">
          <Link href="/admin/users" className="block group">
            <Card className="h-full border-border/50 shadow-none transition-all hover:border-primary/30 hover:bg-accent/30 cursor-pointer">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-orange-500/10 p-2.5">
                    <Users
                      className="size-6 text-orange-600 dark:text-orange-400"
                    />
                  </div>
                  <CardTitle className="text-xl">User management</CardTitle>
                </div>
                <CardDescription className="pt-1.5 leading-relaxed">
                  Review student registrations, verify accounts, and manage
                  roles across the system.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 flex items-center gap-1.5 text-sm font-semibold text-primary">
                Review users
                <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/data" className="block group">
            <Card className="h-full border-border/50 shadow-none transition-all hover:border-primary/30 hover:bg-accent/30 cursor-pointer">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-500/10 p-2.5">
                    <Database
                      className="size-6 text-blue-600 dark:text-blue-400"
                    />
                  </div>
                  <CardTitle className="text-xl">Data management</CardTitle>
                </div>
                <CardDescription className="pt-1.5 leading-relaxed">
                  Maintain the academic catalog: update universities, colleges,
                  majors, and course listings.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 flex items-center gap-1.5 text-sm font-semibold text-primary">
                Open catalog tools
                <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </AppShell>
  );
}
