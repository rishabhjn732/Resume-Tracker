import type { ResumeStatus } from "@/lib/types";

const styles: Record<ResumeStatus, { text: string; className: string }> = {
  processing: { text: "Processing", className: "bg-accent-soft text-accent-strong" },
  ready: { text: "Ready", className: "bg-ok-soft text-ok" },
  failed: { text: "Failed", className: "bg-warn-soft text-warn" },
};

export function ResumeStatusBadge({ status }: { status: ResumeStatus }) {
  const style = styles[status];
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${style.className}`}>
      {style.text}
    </span>
  );
}
