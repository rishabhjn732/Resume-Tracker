import Link from "next/link";
import { ResumeUpload } from "@/components/ResumeUpload";
import { formatDay } from "@/lib/format";
import type { ResumeListItem, ResumeStatus } from "@/lib/types";

type Props = {
  items: ResumeListItem[];
  limit: number;
  selectedId: number;
  // The open resume's live status, so its line updates while it is being read.
  live: { status: ResumeStatus; stepText: string | null };
  uploadDisabled: boolean;
};

function metaText(item: ResumeListItem, status: ResumeStatus, stepText: string | null) {
  if (status === "processing") return stepText ?? "Reading…";
  if (status === "failed") return "Could not read this file";
  return `Ready · ${formatDay(item.createdAt)}`;
}

// The left column on "My resume": upload box and the list of resumes.
export function ResumeRail({ items, limit, selectedId, live, uploadDisabled }: Props) {
  return (
    <aside
      aria-label="Your resumes"
      className="flex min-w-0 flex-[1_1_280px] flex-col gap-4 rounded-xl border border-line bg-white p-5 lg:sticky lg:top-6"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-[17px] font-semibold">Your resumes</h2>
        <span className="text-[13px] text-muted">
          {items.length} of {limit}
        </span>
      </div>

      <ResumeUpload disabled={uploadDisabled} />

      <ul className="-mx-1 flex max-h-[26rem] flex-col gap-1.5 overflow-y-auto px-1 py-0.5">
        {items.map((item) => {
          const selected = item.id === selectedId;
          const status = selected ? live.status : item.status;
          const meta = metaText(item, status, selected ? live.stepText : null);
          return (
            <li key={item.id}>
              <Link
                href={`/dashboard/resumes/${item.id}`}
                aria-current={selected ? "page" : undefined}
                className={`flex min-h-14 flex-col justify-center gap-0.5 rounded-[10px] border px-3 py-2.5 text-ink no-underline hover:text-ink ${
                  selected ? "border-accent bg-accent-soft" : "border-line bg-white hover:bg-ground"
                }`}
              >
                <span className="text-sm font-semibold break-all">{item.fileName}</span>
                <span
                  className={`text-xs ${
                    status === "failed" ? "text-warn" : selected && status === "processing" ? "text-accent-strong" : "text-muted"
                  }`}
                  suppressHydrationWarning
                >
                  {meta}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="text-xs leading-normal text-muted">
        You can keep {limit} resumes. A new upload after that replaces the oldest one.
      </p>
    </aside>
  );
}
