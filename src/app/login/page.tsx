import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { LoginForm } from "@/components/AuthForms";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Log in · VirtualCoach" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <AuthShell subtitle="Log in to your account.">
      <LoginForm />
    </AuthShell>
  );
}
