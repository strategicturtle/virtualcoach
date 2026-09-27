"use server";

import { redirect } from "next/navigation";
import { hashToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// The emailed token is the credential here: only the admin receives it.

export async function approveSignup(token: string) {
  const { count } = await prisma.user.updateMany({
    where: { approvalTokenHash: hashToken(token), status: "PENDING" },
    data: { status: "APPROVED", approvedAt: new Date(), approvalTokenHash: null },
  });
  redirect(`/approve/done?result=${count ? "approved" : "invalid"}`);
}

export async function rejectSignup(token: string) {
  const { count } = await prisma.user.deleteMany({
    where: { approvalTokenHash: hashToken(token), status: "PENDING" },
  });
  redirect(`/approve/done?result=${count ? "rejected" : "invalid"}`);
}
