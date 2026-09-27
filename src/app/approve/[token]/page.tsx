import type { Metadata } from "next";
import AuthShell from "@/components/AuthShell";
import { approveSignup, rejectSignup } from "@/app/actions/approval";
import { hashToken } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Review sign-up · VirtualCoach", robots: { index: false } };

export default async function ApprovePage({ params }: PageProps<"/approve/[token]">) {
  const { token } = await params;
  const user = /^[0-9a-f]{64}$/.test(token)
    ? await prisma.user.findUnique({ where: { approvalTokenHash: hashToken(token) } })
    : null;

  if (!user || user.status !== "PENDING") {
    return (
      <AuthShell subtitle="Review sign-up">
        <p className="rounded-2xl bg-surface p-6 text-center">
          This link has already been used or isn&apos;t valid.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell subtitle="Review sign-up">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-2xl bg-surface p-6">
        <dt className="text-muted">Username</dt>
        <dd className="font-bold break-all">{user.username}</dd>
        <dt className="text-muted">Email</dt>
        <dd className="break-all">{user.email ?? "Not given"}</dd>
        <dt className="text-muted">Signed up</dt>
        <dd>{formatDateTime(user.createdAt)}</dd>
      </dl>
      <div className="mt-6 flex gap-3">
        <form action={rejectSignup.bind(null, token)} className="flex-1">
          <button className="w-full rounded-full border-2 border-gold py-3 font-bold text-gold">
            Reject
          </button>
        </form>
        <form action={approveSignup.bind(null, token)} className="flex-1">
          <button className="w-full rounded-full bg-neon py-3 font-bold text-black hover:brightness-110">
            Approve
          </button>
        </form>
      </div>
    </AuthShell>
  );
}
