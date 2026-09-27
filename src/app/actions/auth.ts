"use server";

import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import {
  createSession,
  destroySession,
  hashPassword,
  hashToken,
  newToken,
  verifyPassword,
} from "@/lib/auth";
import { sendSignupNotification } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export type FormState = { error?: string; done?: boolean };

const USERNAME = /^[a-z0-9_]{3,20}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function appUrl() {
  return (process.env.APP_URL ?? "http://localhost:3100").replace(/\/$/, "");
}

export async function signup(_prev: FormState, formData: FormData): Promise<FormState> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const emailRaw = String(formData.get("email") ?? "").trim();
  const email = emailRaw === "" ? null : emailRaw.toLowerCase();

  if (!USERNAME.test(username)) {
    return { error: "Username must be 3–20 letters, numbers, or underscores." };
  }
  if (password.length < 8 || password.length > 100) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirm) {
    return { error: "Passwords don't match." };
  }
  if (email && (email.length > 254 || !EMAIL.test(email))) {
    return { error: "That email doesn't look right. Leave it blank if you'd rather not share one." };
  }

  const token = newToken();
  let user;
  try {
    user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash: await hashPassword(password),
        approvalTokenHash: hashToken(token),
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "That username is taken. Try another." };
    }
    throw err;
  }

  try {
    await sendSignupNotification(user, `${appUrl()}/approve/${token}`);
  } catch (err) {
    // Without the email nobody can approve them, so don't leave a stuck account behind.
    console.error("Sign-up notification failed:", err);
    await prisma.user.delete({ where: { id: user.id } });
    return { error: "Couldn't send your request right now. Try again in a few minutes." };
  }

  return { done: true };
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Wrong username or password." };
  }
  if (user.status !== "APPROVED") {
    return { error: "Your account is waiting for approval. Try again later." };
  }

  await createSession(user.id);
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
