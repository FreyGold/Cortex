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
    <main className="flex-1 overflow-y-auto custom-scrollbar bg-background">
      <div className="max-w-5xl mx-auto space-y-12 px-6 py-12 md:py-20">
        <header className="space-y-3">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text text-transparent leading-[1.1]">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
            Manage your academic platform's core data, verify student identities, and maintain the knowledge graph.
          </p>
        </header>

        <div className="grid gap-8 md:grid-cols-2">
          <Link href="/admin/users" className="group">
            <div className="h-full flex flex-col p-8 rounded-[2rem] border border-border/40 bg-card hover:border-orange-500/30 transition-all hover:shadow-2xl hover:shadow-orange-500/5 hover:-translate-y-1 relative overflow-hidden">
                <div className="size-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400 mb-6 group-hover:scale-110 transition-transform">
                    <Users className="size-7" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight mb-3">User Management</h3>
                <p className="text-muted-foreground leading-relaxed mb-8 flex-1">
                    Review student registrations, verify academic identities, and manage system roles across the community.
                </p>
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                    Manage Users
                    <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
          </Link>

          <Link href="/admin/data" className="group">
            <div className="h-full flex flex-col p-8 rounded-[2rem] border border-border/40 bg-card hover:border-blue-500/30 transition-all hover:shadow-2xl hover:shadow-blue-500/5 hover:-translate-y-1 relative overflow-hidden">
                <div className="size-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                    <Database className="size-7" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight mb-3">Data Catalog</h3>
                <p className="text-muted-foreground leading-relaxed mb-8 flex-1">
                    Maintain the core academic hierarchy: update universities, colleges, departments, and course listings.
                </p>
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Explore Catalog
                    <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
