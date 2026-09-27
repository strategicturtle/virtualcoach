import { clampScore, type CoachingReport } from "@/lib/coaching/report";

function ScoreBar({ score }: { score: number }) {
  const s = clampScore(score);
  return (
    <div className="flex items-center gap-2" aria-label={`${s} out of 10`}>
      <div className="h-2 w-24 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full"
          style={{ width: `${s * 10}%`, backgroundImage: "var(--gold-shine)" }}
        />
      </div>
      <span className="text-sm font-bold tabular-nums">{s}/10</span>
    </div>
  );
}

export default function CoachingReportView({
  report,
  meta,
}: {
  report: CoachingReport;
  meta: string;
}) {
  return (
    <article className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4 rounded-2xl bg-surface p-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-gold">
            Coach&apos;s review
          </p>
          <p className="mt-1 text-muted">{report.skillObserved}</p>
          <p className="mt-3 leading-relaxed">{report.summary}</p>
        </div>
        <div className="shrink-0 text-center">
          <p className="text-5xl font-extrabold text-gold-shine tabular-nums">
            {clampScore(report.overallScore)}
          </p>
          <p className="text-xs text-muted">out of 10</p>
        </div>
      </header>

      {report.topPriorities.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gold">
            Work on first
          </h3>
          <ol className="mt-2 flex flex-col gap-2">
            {report.topPriorities.map((p, i) => (
              <li key={i} className="flex gap-3 rounded-xl bg-surface p-4">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-neon font-bold text-black">
                  {i + 1}
                </span>
                <span>{p}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {report.strengths.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gold">
            What you&apos;re doing well
          </h3>
          <ul className="mt-2 flex flex-col gap-1.5">
            {report.strengths.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-gold" aria-hidden>
                  ✓
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {report.breakdown.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gold">
            Breakdown
          </h3>
          <div className="mt-2 flex flex-col gap-3">
            {report.breakdown.map((b, i) => (
              <div key={i} className="rounded-xl bg-surface p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-lg font-bold">{b.area}</h4>
                  <ScoreBar score={b.score} />
                </div>
                <p className="mt-3 text-sm font-semibold text-muted">
                  What the coach saw
                </p>
                <p className="mt-0.5">{b.observation}</p>
                <p className="mt-3 text-sm font-semibold text-muted">
                  How to improve
                </p>
                <p className="mt-0.5">{b.howToImprove}</p>
                <div className="mt-3 rounded-lg border border-neon/40 p-3">
                  <p className="text-sm font-bold text-neon">
                    Drill: {b.drill.name}
                  </p>
                  <p className="mt-1 text-sm">{b.drill.instructions}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {report.limitations && (
        <p className="rounded-xl border border-white/10 p-4 text-sm text-muted">
          <b>Note:</b> {report.limitations}
        </p>
      )}
      <p className="text-xs text-muted">{meta}</p>
    </article>
  );
}
