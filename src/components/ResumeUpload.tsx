"use client";

import { useRouter } from "next/navigation";
import { useState, type DragEvent } from "react";
import { Spinner, UploadIcon } from "@/components/icons";
import { formatSize } from "@/lib/format";
import { MAX_RESUME_BYTES, RESUME_FILE_TYPES } from "@/lib/limits";
import type { ResumeDetail } from "@/lib/types";

type UploadResult = { resume: ResumeDetail; removedFileNames: string[] };

type UploadState =
  | { kind: "idle" }
  | { kind: "sending"; file: File; percent: number }
  | { kind: "error"; message: string };

type Props = {
  disabled: boolean;
  // "compact" sits in the list of resumes. "large" is the first upload on an empty page.
  size?: "compact" | "large";
};

// Check the file in the browser first, so a wrong file fails at once.
// The backend checks again, because a browser check is easy to skip.
function checkFile(file: File): string | null {
  const name = file.name.toLowerCase();
  if (!RESUME_FILE_TYPES.some((extension) => name.endsWith(extension))) {
    return "Please choose a PDF or DOCX file.";
  }
  if (file.size === 0) return "This file is empty.";
  if (file.size > MAX_RESUME_BYTES) {
    return `This file is ${formatSize(file.size)}. The limit is 4 MB.`;
  }
  return null;
}

// LEARN: fetch() can't tell us how much of the file is sent yet.
// XMLHttpRequest can, so we use it to draw the progress bar.
function uploadWithProgress(file: File, onProgress: (percent: number) => void) {
  return new Promise<UploadResult>((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);

    const request = new XMLHttpRequest();
    request.open("POST", "/api/resumes");
    request.responseType = "json";
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => {
      if (request.status === 201 && request.response?.resume) {
        resolve(request.response as UploadResult);
        return;
      }
      const detail = request.response?.detail;
      if (request.status === 413) reject(new Error("The file is bigger than 4 MB."));
      else if (typeof detail === "string") reject(new Error(detail));
      else reject(new Error("The upload did not work. Please try again."));
    };
    request.onerror = () => reject(new Error("Network error. Check your internet and try again."));
    request.send(form);
  });
}

export function ResumeUpload({ disabled, size = "compact" }: Props) {
  const router = useRouter();
  const [state, setState] = useState<UploadState>({ kind: "idle" });
  const [dragging, setDragging] = useState(false);
  const large = size === "large";

  async function start(file: File) {
    const problem = checkFile(file);
    if (problem) {
      setState({ kind: "error", message: problem });
      return;
    }

    setState({ kind: "sending", file, percent: 0 });
    try {
      const result = await uploadWithProgress(file, (percent) =>
        setState({ kind: "sending", file, percent }),
      );
      // Open the new resume. Its page shows each step live while the backend works.
      const query = new URLSearchParams();
      result.removedFileNames.forEach((name) => query.append("removed", name));
      const suffix = query.size > 0 ? `?${query}` : "";
      router.push(`/dashboard/resumes/${result.resume.id}${suffix}`);
      router.refresh(); // so the list of resumes shows the new one
      setState({ kind: "idle" });
    } catch (error) {
      setState({ kind: "error", message: error instanceof Error ? error.message : "Upload failed." });
    }
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    if (disabled || state.kind === "sending") return;
    const file = event.dataTransfer.files[0];
    if (file) void start(file);
  }

  const zoneStyle = disabled
    ? "cursor-not-allowed border-line bg-ground opacity-60"
    : dragging
      ? "border-accent bg-accent-soft"
      : "border-line-strong bg-white hover:border-accent hover:bg-ground";

  return (
    <div className="flex flex-col gap-3">
      {state.kind === "sending" ? (
        <div
          className={`flex flex-col gap-2.5 rounded-[10px] border border-line bg-ground ${large ? "p-5" : "p-3.5"}`}
          aria-live="polite"
        >
          <div className="flex items-center gap-2 text-sm">
            <Spinner className="size-3.5" />
            <span className="min-w-0 flex-1 font-medium break-all">{state.file.name}</span>
            <span className="font-mono text-xs text-muted">{state.percent}%</span>
          </div>
          <div
            role="progressbar"
            aria-label="Upload progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={state.percent}
            className="h-1.5 overflow-hidden rounded-full bg-line"
          >
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-200"
              style={{ width: `${state.percent}%` }}
            />
          </div>
          <span className="text-xs text-muted">{state.percent < 100 ? "Uploading…" : "Saving your file…"}</span>
        </div>
      ) : (
        <label
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`relative flex flex-col items-center justify-center gap-1 rounded-[10px] border border-dashed text-center transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent ${large ? "min-h-48 p-8" : "px-3 py-4"} ${zoneStyle}`}
        >
          <UploadIcon className={`text-accent ${large ? "size-8" : "size-[22px]"}`} />
          <span className={`font-semibold text-accent ${large ? "text-lg" : "text-[15px]"}`}>
            {dragging ? "Drop it here" : large ? "Upload your resume" : "Upload a resume"}
          </span>
          <span className="text-[13px] text-muted">
            {large ? "Drop a file here, or click to choose. " : ""}PDF or DOCX, up to 4 MB
          </span>
          <input
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            aria-label="Choose resume file"
            disabled={disabled}
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = ""; // so choosing the same file again still works
              if (file) void start(file);
            }}
          />
        </label>
      )}

      {state.kind === "error" ? (
        <p role="alert" className="rounded-lg border border-warn-line bg-warn-soft p-3 text-sm text-warn">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
