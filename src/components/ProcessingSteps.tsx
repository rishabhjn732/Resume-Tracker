"use client";

import { useEffect, useState } from "react";
import { CheckIcon, CrossIcon } from "@/components/icons";
import { formatSeconds } from "@/lib/format";
import type { ResumeStep } from "@/lib/types";

type Shown = ResumeStep["status"] | "skipped";
type ShownStep = ResumeStep & { shown: Shown };

type Props = {
  steps: ResumeStep[];
  status: "processing" | "failed";
  error: string | null;
};

// The backend may stop (for example, after a restart) while a step still says "running".
// Then that step really failed, and the steps after it never ran.
function shownSteps(steps: ResumeStep[], status: Props["status"], error: string | null): ShownStep[] {
  return steps.map((step) => {
    if (status !== "failed") return { ...step, shown: step.status };
    if (step.status === "running") return { ...step, shown: "failed", detail: error };
    if (step.status === "waiting") return { ...step, shown: "skipped" };
    return { ...step, shown: step.status };
  });
}

function toTime(value: string | null) {
  return value ? new Date(value).getTime() : null;
}

function StepIcon({ shown, number }: { shown: Shown; number: number }) {
  const base = "flex size-7 shrink-0 items-center justify-center rounded-full";
  if (shown === "done") {
    return (
      <span className={`${base} bg-accent text-white`}>
        <CheckIcon />
      </span>
    );
  }
  if (shown === "failed") {
    return (
      <span className={`${base} bg-warn text-white`}>
        <CrossIcon />
      </span>
    );
  }
  if (shown === "running") {
    return (
      <span className={`${base} bg-accent-soft`}>
        <span className="size-3.5 animate-spin rounded-full border-2 border-accent border-t-transparent motion-reduce:animate-none" />
      </span>
    );
  }
  const look = shown === "skipped" ? "bg-off-soft text-muted" : "border border-line-strong text-muted";
  return <span className={`${base} font-mono text-xs font-medium ${look}`}>{number}</span>;
}

const statusWords: Record<Shown, string> = {
  waiting: "waiting",
  running: "running now",
  done: "done",
  failed: "failed",
  skipped: "not run",
};

// "Reading your new resume": each step, what it found and how long it took.
export function ProcessingSteps({ steps, status, error }: Props) {
  // The clock starts after the page loads in the browser,
  // so the server HTML and the first browser render are the same.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (status !== "processing") return;
    const timer = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(timer);
  }, [status]);

  const shown = shownSteps(steps, status, error);
  const doneCount = shown.filter((step) => step.shown === "done").length;
  const current = shown.find((step) => step.shown === "running");
  const firstStart = toTime(shown[0]?.startedAt ?? null);
  const elapsed = status === "processing" && firstStart !== null && now !== null ? now - firstStart : null;
  const failed = status === "failed";

  return (
    <section
      aria-labelledby="reading-title"
      className={`flex flex-col gap-5 rounded-xl border bg-white p-6 md:p-7 ${failed ? "border-warn-line" : "border-line"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h1 id="reading-title" className="text-2xl font-semibold">
            {failed ? "We could not finish reading this resume" : "Reading your new resume"}
          </h1>
          <p className={`text-[15px] leading-normal ${failed ? "text-warn" : "text-muted"}`}>
            {failed
              ? (error ?? "Something went wrong while reading the file.")
              : "This takes about a minute. You can leave this page, we keep working."}
          </p>
        </div>
        {elapsed !== null ? (
          <span className="font-mono text-sm font-medium text-muted">{formatSeconds(elapsed)}</span>
        ) : null}
      </div>

      {!failed ? (
        <div
          role="progressbar"
          aria-label="Reading progress"
          aria-valuemin={0}
          aria-valuemax={shown.length}
          aria-valuenow={doneCount}
          className="h-1.5 overflow-hidden rounded-full bg-off-soft"
        >
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-500"
            style={{ width: `${(doneCount / Math.max(shown.length, 1)) * 100}%` }}
          />
        </div>
      ) : null}

      {/* Screen readers hear each new step, without reading the whole list again. */}
      <p className="sr-only" aria-live="polite">
        {current ? `Now: ${current.label}` : ""}
      </p>

      <ol className="flex flex-col">
        {shown.map((step, index) => {
          const start = toTime(step.startedAt);
          const end = step.shown === "running" ? now : toTime(step.finishedAt);
          const took = start !== null && end !== null ? end - start : null;
          const quiet = step.shown === "waiting" || step.shown === "skipped";

          return (
            <li key={step.key} className="flex gap-3.5">
              <div className="flex w-7 shrink-0 flex-col items-center">
                <StepIcon shown={step.shown} number={index + 1} />
                {index < shown.length - 1 ? (
                  <div className={`min-h-3.5 w-0.5 flex-1 ${step.shown === "done" ? "bg-accent" : "bg-off-soft"}`} />
                ) : null}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1 pt-0.5 pb-5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className={`text-base font-semibold ${quiet ? "text-muted" : ""}`}>
                    {step.label}
                    <span className="sr-only"> ({statusWords[step.shown]})</span>
                  </span>
                  {took !== null && !quiet ? (
                    <span className="font-mono text-[13px] text-muted">{formatSeconds(took)}</span>
                  ) : null}
                </div>
                {step.shown === "running" ? (
                  <p className="animate-pulse text-sm leading-normal text-accent-strong motion-reduce:animate-none">
                    {step.detail}
                  </p>
                ) : step.shown === "failed" ? (
                  <p className="text-sm leading-normal text-warn">{step.detail ?? "This step did not finish."}</p>
                ) : step.shown === "skipped" ? (
                  <p className="text-sm leading-normal text-muted">Not run, because an earlier step failed.</p>
                ) : step.shown === "waiting" ? (
                  <p className="text-sm leading-normal text-muted">Waiting</p>
                ) : (
                  <p className="text-sm leading-normal text-muted">{step.detail}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
