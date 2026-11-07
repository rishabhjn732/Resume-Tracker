import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChatWindow } from "@/components/ChatWindow";
import { requireCandidate, requireHrPhone } from "@/lib/session";
import { getMemory, getQuestionsUsed, getThread } from "@/lib/store";

export const metadata: Metadata = { title: "Chat | Resume Assistant" };

// LEARN (server + client together):
// 1. This Server Component loads the chat data.
// 2. It passes the data to ChatWindow, a Client Component.
// 3. ChatWindow handles typing, clicks and new messages in the browser.
export default async function ThreadPage({
  params,
}: {
  params: Promise<{ userId: string; threadId: string }>;
}) {
  const { userId, threadId } = await params;
  const candidate = await requireCandidate(userId);

  // A layout check is not enough. Each page must check access too.
  const phone = await requireHrPhone(userId);
  const thread = getThread(userId, phone, threadId);
  if (!thread) notFound();

  return (
    <ChatWindow
      key={thread.id}
      userId={userId}
      threadId={thread.id}
      firstName={candidate.firstName}
      title={thread.title}
      initialMessages={thread.messages}
      initialUsed={getQuestionsUsed(userId, phone)}
      initialMemory={getMemory(userId, phone)}
    />
  );
}
