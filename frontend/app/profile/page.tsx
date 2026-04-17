import { AppShell } from "@/components/app-shell";
import { ProfileStatusCard } from "@/components/profile/profile-status-card";
import { getMessage } from "@/lib/messages";
import { getMessages } from "next-intl/server";

export default async function ProfilePage() {
  const messages = await getMessages();

  return (
    <AppShell>
      <main className="container mx-auto max-w-3xl space-y-6 px-4 py-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            {getMessage(messages, "profilePage.title", "Your profile")}
          </h1>
          <p className="text-muted-foreground">
            {getMessage(
              messages,
              "profilePage.subtitle",
              "Keep your academic context updated and request verification from here.",
            )}
          </p>
        </header>

        <ProfileStatusCard />
      </main>
    </AppShell>
  );
}
