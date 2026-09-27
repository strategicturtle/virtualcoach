"use client";

import { useState } from "react";
import CoachingReportView from "@/components/CoachingReportView";
import { captureFrames } from "@/lib/coaching/frames";
import { LEVELS, POSITIONS, SKILLS, type CoachingContext } from "@/lib/coaching/options";
import type { CoachingReport } from "@/lib/coaching/report";

export type SavedAnalysis = CoachingContext & {
  report: CoachingReport;
  frameCount: number;
  createdAt: string;
};

type Phase = "form" | "capturing" | "analyzing";

const select =
  "mt-1 w-full rounded-xl border border-white/15 bg-surface px-3 py-3 text-base text-foreground focus:border-gold focus:outline-none";

function describe(a: SavedAnalysis) {
  const when = new Date(a.createdAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return `${a.skill} · ${a.position} · ${a.level} — reviewed ${when} from ${a.frameCount} frames of your clip. AI feedback can be wrong; trust your coach.`;
}

export default function Coach({
  videoId,
  seconds,
  initial,
  defaults,
}: {
  videoId: string;
  seconds: number;
  initial: SavedAnalysis | null;
  defaults: Partial<CoachingContext>;
}) {
  const [analysis, setAnalysis] = useState<SavedAnalysis | null>(initial);
  const [showForm, setShowForm] = useState(!initial);
  const [phase, setPhase] = useState<Phase>("form");
  const [error, setError] = useState("");
  const [ctx, setCtx] = useState<CoachingContext>({
    skill: defaults.skill ?? initial?.skill ?? SKILLS[0],
    position: defaults.position ?? initial?.position ?? POSITIONS[0],
    level: defaults.level ?? initial?.level ?? LEVELS[0],
  });

  async function run() {
    setError("");
    try {
      setPhase("capturing");
      const src = await fetch(`/api/videos/${videoId}?format=json`).then((r) => r.json());
      const frames = await captureFrames(src.url, seconds);

      setPhase("analyzing");
      const res = await fetch(`/api/videos/${videoId}/analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...ctx, frames }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Coaching failed. Try again.");

      setAnalysis({ ...data.analysis, createdAt: data.analysis.createdAt });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Coaching failed. Try again.");
    } finally {
      setPhase("form");
    }
  }

  const busy = phase !== "form";

  return (
    <section className="mt-8 flex flex-col gap-6">
      {showForm && (
        <div className="rounded-2xl border-2 border-neon bg-surface p-5">
          <h2 className="text-xl font-bold">Get AI coaching</h2>
          <p className="mt-1 text-sm text-muted">
            Tell the coach what you&apos;re working on for more accurate feedback.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <label className="text-sm font-semibold text-muted">
              Skill
              <select
                className={select}
                value={ctx.skill}
                disabled={busy}
                onChange={(e) => setCtx({ ...ctx, skill: e.target.value as CoachingContext["skill"] })}
              >
                {SKILLS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-muted">
              Position
              <select
                className={select}
                value={ctx.position}
                disabled={busy}
                onChange={(e) => setCtx({ ...ctx, position: e.target.value as CoachingContext["position"] })}
              >
                {POSITIONS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-muted">
              Level
              <select
                className={select}
                value={ctx.level}
                disabled={busy}
                onChange={(e) => setCtx({ ...ctx, level: e.target.value as CoachingContext["level"] })}
              >
                {LEVELS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </label>
          </div>
          {error && (
            <p role="alert" className="mt-3 text-sm text-neon">
              {error}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={run}
              disabled={busy}
              className="rounded-full bg-neon px-6 py-3 font-bold text-black hover:brightness-110 disabled:opacity-60"
            >
              {phase === "capturing"
                ? "Reading your clip…"
                : phase === "analyzing"
                  ? "Coach is reviewing…"
                  : "Get coaching"}
            </button>
            {analysis && !busy && (
              <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gold hover:underline">
                Cancel
              </button>
            )}
            {phase === "analyzing" && (
              <span className="text-sm text-muted" aria-live="polite">
                This usually takes 30–90 seconds. Keep this page open.
              </span>
            )}
          </div>
        </div>
      )}

      {analysis && (
        <>
          {!showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="self-start rounded-full border-2 border-gold px-5 py-2 text-sm font-bold text-gold"
            >
              Analyze again
            </button>
          )}
          <CoachingReportView report={analysis.report} meta={describe(analysis)} />
        </>
      )}
    </section>
  );
}
