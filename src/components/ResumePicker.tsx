"use client";

import { useRouter } from "next/navigation";
import type { ResumeListItem } from "@/lib/types";

type Props = {
  label: string;
  resumes: ResumeListItem[];
  selectedId: number;
  // Which page to open for the chosen resume: "chat" or "hr".
  page: "chat" | "hr";
};

// A drop-down to switch to another resume on the same tab.
export function ResumePicker({ label, resumes, selectedId, page }: Props) {
  const router = useRouter();

  return (
    <label className="flex flex-wrap items-center gap-2 text-sm text-muted">
      <span>{label}</span>
      <select
        value={selectedId}
        onChange={(event) => router.push(`/dashboard/resumes/${event.target.value}/${page}`)}
        className="min-h-9 max-w-full rounded-lg border border-line-strong bg-white px-2 py-1 text-sm text-ink"
      >
        {resumes.map((resume) => (
          <option key={resume.id} value={resume.id}>
            {resume.fileName}
            {resume.status === "ready" ? "" : resume.status === "processing" ? " (reading…)" : " (failed)"}
          </option>
        ))}
      </select>
    </label>
  );
}
