import "server-only";
import { formatDateTime } from "@/lib/format";

type SignupInfo = { username: string; email: string | null; createdAt: Date };

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/**
 * Emails the admin about a new sign-up with a link to approve or reject it.
 * Sent through Resend's HTTPS API (Railway blocks SMTP on this plan).
 */
export async function sendSignupNotification(info: SignupInfo, reviewUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_EMAIL;
  if (!apiKey || !to) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[email disabled] New sign-up "${info.username}". Review: ${reviewUrl}`);
      return;
    }
    throw new Error("Email is not configured (RESEND_API_KEY / ADMIN_EMAIL).");
  }

  const name = escapeHtml(info.username);
  const email = info.email ? escapeHtml(info.email) : "<i>not given</i>";
  const when = formatDateTime(info.createdAt);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "VirtualCoach <onboarding@resend.dev>",
      to: [to],
      subject: `VirtualCoach sign-up: ${info.username}`,
      text: `New VirtualCoach sign-up\n\nUsername: ${info.username}\nEmail: ${info.email ?? "not given"}\nSigned up: ${when}\n\nApprove or reject: ${reviewUrl}\n`,
      html: `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5">
  <h2 style="margin:0 0 12px">New VirtualCoach sign-up</h2>
  <p style="margin:0">Username: <b>${name}</b><br>Email: ${email}<br>Signed up: ${when}</p>
  <p style="margin:20px 0"><a href="${reviewUrl}" style="background:#ff5f1f;color:#000;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:bold">Approve or reject</a></p>
  <p style="color:#666;font-size:13px">The link opens a page where you confirm your choice.</p>
</div>`,
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend error ${res.status}: ${await res.text()}`);
  }
}
