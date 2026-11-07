"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ProcessingSteps } from "@/components/ProcessingSteps";
import { ResumeRail } from "@/components/ResumeRail";
import { ResumeSummaryView } from "@/components/ResumeSummaryView";
import { formatDate, formatSize } from "@/lib/format";
import type { ResumeDetail, ResumeList } from "@/lib/types";

type Props = {
  initial: ResumeDetail;
  list: ResumeList;
  removedFileNames: string[];
};

// Gray blocks in the shape of the summary, while the AI is still working.
function SummaryPlaceholder() {
  return (
    <section aria-label="Summary placeholder" className="flex flex-col gap-4 rounded-xl border border-line bg-white p-6 md:p-7">
      <p className="text-sm text-muted">Your summary shows here when step 3 is done.</p>
      <div aria-hidden="true" className="flex animate-pulse flex-col gap-4 motion-reduce:animate-none">
        <div className="flex items-center gap-4">
          <div className="size-14 rounded-full bg-off-soft" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-4 w-56 max-w-full rounded bg-off-soft" />
            <div className="h-3 w-40 max-w-full rounded bg-off-soft" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="h-3 w-full rounded bg-off-soft" />
          <div className="h-3 w-11/12 rounded bg-off-soft" />
          <div className="h-3 w-4/5 rounded bg-off-soft" />
        </div>
        <div className="flex flex-wrap gap-2">
          {[70, 96, 82, 110, 64].map((width, index) => (
            <div key={index} className="h-7 rounded-full bg-off-soft" style={{ width }} />
          ))}
        </div>
      </div>
    </section>
  );
}

// File details and the Delete button.
function FileCard({ resume, onDeleted }: { resume: ResumeDetail; onDeleted: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = resume.status === "processing";

  async function remove() {
    setDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/resumes/${resume.id}`, { method: "DELETE" });
      if (!response.ok && response.status !== 404) throw new Error();
      onDeleted();
    } catch {
      setError("Could not delete the resume. Please try again.");
      setDeleting(false);
    }
  }

  const meta = [
    resume.contentType.includes("pdf") ? "PDF" : "DOCX",
    formatSize(resume.sizeBytes),
    resume.pageCount ? `${resume.pageCount} ${resume.pageCount === 1 ? "page" : "pages"}` : null,
  ].filter(Boolean);

  return (
    <section className="flex min-w-0 flex-col gap-3 rounded-xl border border-line bg-white p-6">
      <h2 className="text-[19px] font-semibold">File</h2>
      <div className="flex flex-col gap-0.5">
        <span className="text-[15px] font-semibold break-all">{resume.fileName}</span>
        <span className="text-sm text-muted">{meta.join(" · ")}</span>
        <span className="text-sm text-muted" suppressHydrationWarning>
          Uploaded {formatDate(resume.createdAt)}
        </span>
      </div>
      {confirming ? (
        <div className="flex flex-col gap-2 rounded-lg bg-warn-soft p-3">
          <span className="text-sm text-warn">Delete this resume? HR will not be able to ask about it.</span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={remove}
              disabled={deleting}
              className="min-h-10 rounded-lg bg-warn px-4 text-sm font-medium text-white disabled:opacity-60"
            >
              {deleting ? "Deleting…" : "Yes, delete"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={deleting}
              className="min-h-10 rounded-lg border border-line-strong bg-white px-4 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={busy}
          title={busy ? "You can delete it when reading is done." : undefined}
          className="min-h-10 self-start rounded-lg border border-line-strong bg-white px-4 text-sm font-medium text-warn hover:bg-warn-soft disabled:cursor-not-allowed disabled:opacity-50"
        >
          Delete resume
        </button>
      )}
      {error ? (
        <p role="alert" className="text-sm text-warn">
          {error}
        </p>
      ) : null}
    </section>
  );
}

export function ResumeView({ initial, list, removedFileNames }: Props) {
  const router = useRouter();
  const [resume, setResume] = useState(initial);
  const [attempt, setAttempt] = useState(0);
  const [connectionLost, setConnectionLost] = useState(false);
  const [justFinished, setJustFinished] = useState(false);
  const [showRemoved, setShowRemoved] = useState(removedFileNames.length > 0);

  // LEARN (polling): while the backend works, ask for the latest steps every second.
  // Each answer changes "resume", which runs this effect again for the next check.
  // It stops by itself when the status is "ready" or "failed".
  useEffect(() => {
    if (resume.status !== "processing") return;
    let stopped = false;

    const timer = setTimeout(
      async () => {
        try {
          const response = await fetch(`/api/resumes/${resume.id}`, { cache: "no-store" });
          if (!response.ok) throw new Error(`Status ${response.status}`);
          const next: ResumeDetail = await response.json();
          if (stopped) return;
          setConnectionLost(false);
          setResume(next);
          if (next.status !== "processing") {
            setJustFinished(next.status === "ready");
            router.refresh(); // update the list on the left (name, status)
          }
        } catch {
          if (stopped) return;
          setConnectionLost(true);
          setAttempt((value) => value + 1); // try again
        }
      },
      attempt > 0 ? 3000 : 1000,
    );

    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [resume, attempt, router]);

  const runningIndex = resume.steps.findIndex((step) => step.status === "running");
  const stepText =
    resume.status === "processing"
      ? `Reading… step ${(runningIndex >= 0 ? runningIndex : resume.steps.filter((s) => s.status === "done").length) + 1} of ${resume.steps.length}`
      : null;

  const fileCard = <FileCard resume={resume} onDeleted={() => router.push("/dashboard")} />;

  return (
    <div className="flex flex-wrap items-start gap-6">
      <ResumeRail
        items={list.items}
        limit={list.limit}
        selectedId={resume.id}
        live={{ status: resume.status, stepText }}
        uploadDisabled={Boolean(list.unavailableReason)}
      />

      <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-5">
        {list.unavailableReason ? (
          <p role="status" className="rounded-xl border border-warn-line bg-warn-soft p-4 text-sm text-warn">
            New uploads are off right now. {list.unavailableReason}
          </p>
        ) : null}

        {showRemoved ? (
          <div role="status" className="flex flex-wrap items-start gap-3 rounded-xl bg-accent-soft p-4">
            <p className="min-w-0 flex-1 text-sm text-accent-strong">
              You can keep {list.limit} resumes, so we removed the oldest:{" "}
              <span className="font-semibold break-all">{removedFileNames.join(", ")}</span>
            </p>
            <button
              type="button"
              onClick={() => setShowRemoved(false)}
              className="min-h-9 px-2 text-sm font-medium text-accent-strong underline"
            >
              Close
            </button>
          </div>
        ) : null}

        {connectionLost ? (
          <p role="status" className="rounded-lg bg-warn-soft p-3 text-sm text-warn">
            Lost the connection to the server. Trying again…
          </p>
        ) : null}

        {resume.status === "processing" ? (
          <>
            <ProcessingSteps steps={resume.steps} status="processing" error={null} />
            {resume.summary ? (
              <ResumeSummaryView summary={resume.summary} resumeId={resume.id} />
            ) : (
              <SummaryPlaceholder />
            )}
          </>
        ) : resume.status === "failed" ? (
          <>
            <ProcessingSteps steps={resume.steps} status="failed" error={resume.error} />
            <p className="text-sm text-muted">
              Fix the file if needed, then upload it again with the box on the left.
            </p>
            <div className="max-w-md">{fileCard}</div>
          </>
        ) : resume.summary ? (
          <>
            {justFinished ? (
              <div
                role="status"
                className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] bg-ok-soft px-4 py-3"
              >
                <span className="text-[15px] font-semibold text-ok">
                  Your resume is ready. HR can now ask questions about it.
                </span>
                <button
                  type="button"
                  onClick={() => setJustFinished(false)}
                  className="min-h-9 px-2 text-sm font-medium text-ok underline"
                >
                  Close
                </button>
              </div>
            ) : null}
            <ResumeSummaryView summary={resume.summary} resumeId={resume.id} side={fileCard} />
          </>
        ) : (
          <div className="max-w-md">{fileCard}</div>
        )}
      </div>
    </div>
  );
}
