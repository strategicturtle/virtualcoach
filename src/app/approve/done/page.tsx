import AuthShell from "@/components/AuthShell";

const MESSAGES: Record<string, string> = {
  approved: "Approved. They can log in now.",
  rejected: "Rejected. The sign-up request was deleted.",
};

export default async function ApproveDonePage({ searchParams }: PageProps<"/approve/done">) {
  const { result } = await searchParams;
  const message =
    MESSAGES[String(result)] ?? "This link has already been used or isn't valid.";
  return (
    <AuthShell subtitle="Review sign-up">
      <p className="rounded-2xl bg-surface p-6 text-center">{message}</p>
    </AuthShell>
  );
}
