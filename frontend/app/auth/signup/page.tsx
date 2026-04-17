import { AuthForm } from "@/components/auth/auth-form";

export const metadata = {
  title: "Sign Up | Cortex",
};

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <AuthForm mode="signup" />
    </main>
  );
}
