import type { Metadata } from "next";
import { HrEntryForm } from "@/components/HrEntryForm";
import { requireCandidate } from "@/lib/session";

export const metadata: Metadata = { title: "Open resume chat | Resume Assistant" };

// LEARN (dynamic route): [userId] in the folder name is a variable.
// URL /c/rishabh-jain-4821 gives params.userId = "rishabh-jain-4821".
export default async function HrEntryPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const candidate = await requireCandidate(userId);
  const initials = candidate.name
    .split(" ")
    .map((part) => part[0])
    .join("");

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <main className="flex w-full max-w-lg flex-col gap-7 rounded-xl border border-line bg-white p-6 md:p-10">
        <div className="text-sm font-semibold">Resume Assistant</div>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold">Check the candidate</h1>
          <p className="text-muted">This link opens the chat for this candidate only.</p>
        </div>
        <div className="flex items-center gap-4 rounded-lg bg-ground p-4">
          <div
            aria-hidden="true"
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-semibold text-white"
          >
            {initials}
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <div className="text-lg font-semibold">{candidate.name}</div>
            <div className="text-sm text-muted">{candidate.title}</div>
            <div className="font-mono text-sm font-medium break-words">User ID: {candidate.userId}</div>
          </div>
        </div>
        <HrEntryForm userId={candidate.userId} />
      </main>
    </div>
  );
}
