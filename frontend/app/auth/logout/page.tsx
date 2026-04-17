import { SignOut } from "@phosphor-icons/react/dist/ssr";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function LogoutPage() {
  const t = await getTranslations("auth");

  return (
    <main className="container mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center px-4">
      <Card className="w-full shadow-none border-border/60">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
            <SignOut className="size-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {t("signOutTitle")}
          </CardTitle>
          <CardDescription>{t("signOutSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action="/auth/logout/submit" method="post">
            <Button type="submit" className="w-full" size="lg">
              {t("signOut")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
