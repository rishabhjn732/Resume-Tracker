"use client";

import { useState } from "react";

export function ResumeUpload({ fileName }: { fileName: string }) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  return (
    <>
      <label className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong p-5 text-center">
        <span className="font-medium text-accent">Replace your resume</span>
        <span className="text-sm text-muted">PDF or DOCX</span>
        <input
          type="file"
          accept=".pdf,.docx"
          aria-label="Choose resume file"
          className="max-w-full text-sm"
          onChange={(event) => setSelectedFile(event.target.files?.[0]?.name ?? null)}
        />
      </label>
      {selectedFile ? (
        <p className="rounded-lg bg-warn-soft p-3 text-sm text-warn">
          {selectedFile} selected. Upload will work after we connect the backend in phase 1.
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-ground px-4 py-3">
        <span className="font-medium">{fileName}</span>
        <span className="rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent-strong">
          Sample
        </span>
      </div>
    </>
  );
}
