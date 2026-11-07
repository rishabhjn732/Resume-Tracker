import type { ReactNode } from "react";
import Link from "next/link";
import { createThread } from "@/app/c/[userId]/actions";
import { ThreadList } from "@/components/ThreadList";
import { DAILY_QUESTION_LIMIT } from "@/lib/limits";
import { requireCandidate, requireHrPhone } from "@/lib/session";
import { getQuestionsUsed, listThreads } from "@/lib/store";

// LEARN (nested layout): This sidebar stays on screen while the chat page changes.
// "children" is the open chat from [threadId]/page.tsx.
export default async function ChatLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const candidate = await requireCandidate(userId);
  const phone = await requireHrPhone(userId);

  const threads = listThreads(userId, phone).map(({ id, title }) => ({ id, title }));
  const used = getQuestionsUsed(userId, phone);
  const atLimit = used >= DAILY_QUESTION_LIMIT;

  return (
    <div className="flex min-h-screen flex-wrap items-stretch">
      <nav
        aria-label="Chat threads"
        className="flex min-w-0 flex-[1_1_264px] flex-col gap-5 border-r border-line bg-white px-4 py-5 min-[1144px]:sticky min-[1144px]:top-0 min-[1144px]:h-screen min-[1144px]:self-start min-[1144px]:overflow-y-auto"
      >
        <div className="text-sm font-semibold">Resume Assistant</div>
        <div className="rounded-lg bg-ground p-3">
          <div className="text-sm font-semibold">{candidate.name}</div>
          <div className="mt-1 font-mono text-xs break-words text-muted">{candidate.userId}</div>
        </div>
        <form action={createThread.bind(null, userId)}>
          <button
            type="submit"
            className="min-h-11 w-full rounded-lg border border-ink bg-white px-3 text-sm font-medium hover:bg-ground"
          >
            New chat
          </button>
        </form>
        <div className="flex flex-col gap-1">
          <div className="px-2 pb-1 text-sm text-muted">Your chats</div>
          <ThreadList userId={userId} threads={threads} />
        </div>
        <div className="mt-auto flex flex-col gap-3">
          <div className={`flex flex-col gap-2 rounded-lg p-3 ${atLimit ? "bg-warn-soft text-warn" : "bg-ground"}`}>
            <div className="flex justify-between gap-2 text-sm">
              <span>Questions today</span>
              <span className="font-semibold">
                {used} of {DAILY_QUESTION_LIMIT}
              </span>
            </div>
            <div
              role="img"
              aria-label={`${used} of ${DAILY_QUESTION_LIMIT} questions used`}
              className="h-1.5 rounded-full bg-line"
            >
              <div
                className={`h-1.5 rounded-full ${atLimit ? "bg-warn" : "bg-accent"}`}
                style={{ width: `${(used / DAILY_QUESTION_LIMIT) * 100}%` }}
              />
            </div>
          </div>
          <Link href={`/c/${userId}`} className="inline-flex min-h-11 items-center px-2 text-sm text-accent underline">
            Change phone number
          </Link>
        </div>
      </nav>
      {children}
    </div>
  );
}
