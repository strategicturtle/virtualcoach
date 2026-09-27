"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, signup, type FormState } from "@/app/actions/auth";

const input =
  "mt-1 w-full rounded-xl border border-white/15 bg-surface px-4 py-3 text-base text-foreground placeholder:text-muted/60 focus:border-gold focus:outline-none";
const label = "block text-sm font-semibold text-muted";
const submit =
  "mt-2 w-full rounded-full bg-neon py-3 font-bold text-black hover:brightness-110 disabled:opacity-60";

function ErrorText({ state }: { state: FormState }) {
  return state.error ? (
    <p role="alert" className="text-sm text-neon">
      {state.error}
    </p>
  ) : null;
}

export function LoginForm() {
  const [state, action, pending] = useActionState(login, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className={label}>
        Username
        <input name="username" autoComplete="username" autoCapitalize="none" required className={input} />
      </label>
      <label className={label}>
        Password
        <input name="password" type="password" autoComplete="current-password" required className={input} />
      </label>
      <ErrorText state={state} />
      <button type="submit" disabled={pending} className={submit}>
        {pending ? "Logging in…" : "Log in"}
      </button>
      <p className="text-center text-sm text-muted">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-gold hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, {});

  if (state.done) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl bg-surface p-6 text-center">
        <p className="text-2xl font-extrabold text-gold-shine">Request sent</p>
        <p className="text-muted">
          Your account needs to be approved before you can log in. Check back soon.
        </p>
        <Link href="/login" className="mt-2 font-semibold text-gold hover:underline">
          Go to log in
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className={label}>
        Username
        <input
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          required
          minLength={3}
          maxLength={20}
          pattern="[A-Za-z0-9_]+"
          title="Letters, numbers, and underscores"
          className={input}
        />
      </label>
      <label className={label}>
        Password
        <input name="password" type="password" autoComplete="new-password" required minLength={8} className={input} />
      </label>
      <label className={label}>
        Confirm password
        <input name="confirm" type="password" autoComplete="new-password" required minLength={8} className={input} />
      </label>
      <label className={label}>
        Email <span className="font-normal">(optional)</span>
        <input name="email" type="email" autoComplete="email" className={input} />
      </label>
      <ErrorText state={state} />
      <button type="submit" disabled={pending} className={submit}>
        {pending ? "Sending request…" : "Request account"}
      </button>
      <p className="text-center text-sm text-muted">
        Already approved?{" "}
        <Link href="/login" className="font-semibold text-gold hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
