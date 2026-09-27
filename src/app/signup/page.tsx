import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { SignupForm } from "@/components/AuthForms";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign up · VirtualCoach" };

export default async function SignupPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <AuthShell subtitle="Request an account. New accounts are approved by hand.">
      <SignupForm />
    </AuthShell>
  );
}
