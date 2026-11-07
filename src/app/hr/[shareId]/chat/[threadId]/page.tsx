import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { HrChat } from "@/components/HrChat";
import { getHrMe, getHrThread } from "@/lib/backend";
import { getHrToken } from "@/lib/hr-auth";

export const metadata: Metadata = { title: "Resume chat | Resume Assistant" };

type Props = { params: Promise<{ shareId: string; threadId: string }> };

// URL: /hr/{shareId}/chat/{threadId}
export default async function HrThreadPage({ params }: Props) {
  const { shareId, threadId } = await params;
  if (!/^\d+$/.test(threadId)) notFound();
  const entry = `/hr/${encodeURIComponent(shareId)}`;
  const token = await getHrToken(shareId);
  if (!token) redirect(entry);
  const [me, thread] = await Promise.all([getHrMe(shareId, token), getHrThread(shareId, token, Number(threadId))]);
  if (!me) redirect(entry);
  if (!thread) notFound();

  return <HrChat key={thread.id} shareId={shareId} me={me} thread={thread} />;
}
