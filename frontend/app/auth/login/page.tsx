import { AuthForm } from "@/components/auth/auth-form";

export const metadata = {
  title: "Login | Cortex",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <AuthForm mode="login" />
    </main>
  );
}
