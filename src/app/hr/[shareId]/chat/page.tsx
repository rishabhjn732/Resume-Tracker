import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { HrChat } from "@/components/HrChat";
import { getHrMe } from "@/lib/backend";
import { getHrToken } from "@/lib/hr-auth";

export const metadata: Metadata = { title: "Resume chat | Resume Assistant" };

type Props = { params: Promise<{ shareId: string }> };

// URL: /hr/{shareId}/chat  ->  the newest chat, or an empty one (the first question creates it).
export default async function HrChatHome({ params }: Props) {
  const { shareId } = await params;
  const entry = `/hr/${encodeURIComponent(shareId)}`;
  const token = await getHrToken(shareId);
  if (!token) redirect(entry);
  const me = await getHrMe(shareId, token);
  if (!me) redirect(entry);
  if (me.threads.length > 0) redirect(`${entry}/chat/${me.threads[0].id}`);

  return <HrChat shareId={shareId} me={me} thread={null} />;
}
