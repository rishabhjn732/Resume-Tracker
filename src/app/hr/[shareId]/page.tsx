import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { HrStartForm } from "@/components/HrStartForm";
import { getHrMe, getPublicShare } from "@/lib/backend";
import { getHrToken } from "@/lib/hr-auth";

export const metadata: Metadata = { title: "Resume chat | Resume Assistant" };

type Props = { params: Promise<{ shareId: string }> };

// URL: /hr/{shareId}  (the link the candidate sends to HR)
// HR sees whose resume it is, and enters a phone number to start.
export default async function HrEntryPage({ params }: Props) {
  const { shareId } = await params;
  const share = await getPublicShare(shareId);
  if (!share) notFound();

  // Already started on this link? Go straight to the chats.
  const token = await getHrToken(shareId);
  if (token && share.open && (await getHrMe(shareId, token))) redirect(`/hr/${encodeURIComponent(shareId)}/chat`);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-md flex-col gap-6 rounded-2xl border border-line bg-white p-7 md:p-9">
        <div className="flex items-center gap-2.5 text-[15px] font-semibold">
          <span aria-hidden="true" className="flex size-7 items-center justify-center rounded-lg bg-accent text-xs text-white">
            RA
          </span>
          Resume Assistant
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-[26px] leading-tight font-semibold">Ask about {share.candidateName}</h1>
          {share.headline ? <p className="text-muted">{share.headline}</p> : null}
          <p className="text-[15px] leading-relaxed text-muted">
            Ask questions about {share.firstName}&apos;s experience and skills, and book a call. You can ask{" "}
            {share.dailyQuestionLimit} questions a day.
          </p>
        </div>
        {share.open ? (
          <HrStartForm shareId={shareId} firstName={share.firstName} />
        ) : (
          <p role="status" className="rounded-lg border border-warn-line bg-warn-soft p-4 text-[15px] text-warn">
            {share.closedReason}
          </p>
        )}
      </div>
    </main>
  );
}
