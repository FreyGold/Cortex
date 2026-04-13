import { AuthForm } from "@/components/auth/auth-form";

export const metadata = {
  title: "Sign Up | Cortex",
};

export default function SignupPage() {
  return (
    <main className="container mx-auto px-4 py-12">
      <AuthForm mode="signup" />
    </main>
  );
}
