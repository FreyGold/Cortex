import { getTranslations } from "next-intl/server";
import { CortexButton } from "@/components/ui/cortex-button";

export default async function LogoutPage() {
  const t = await getTranslations("auth");

  return (
    <main className="container mx-auto max-w-md px-4 py-12">
      <div className="rounded-lg border border-border bg-card p-6 shadow-card">
        <h1 className="mb-2 text-2xl font-semibold">{t("signOutTitle")}</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {t("signOutSubtitle")}
        </p>

        <form action="/auth/logout/submit" method="post">
          <CortexButton type="submit" className="w-full">
            {t("signOut")}
          </CortexButton>
        </form>
      </div>
    </main>
  );
}
