import { AuthForm } from "@/components/auth/auth-form";

export const metadata = {
  title: "Login | Cortex",
};

export default function LoginPage() {
  return (
    <main className="container mx-auto px-4 py-12">
      <AuthForm mode="login" />
    </main>
  );
}
