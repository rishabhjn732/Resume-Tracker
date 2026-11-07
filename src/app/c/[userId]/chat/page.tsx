import { redirect } from "next/navigation";
import { requireCandidate, requireHrPhone } from "@/lib/session";
import { getOrCreateEmptyThread, listThreads } from "@/lib/store";

// URL /c/[userId]/chat has no screen of its own.
// It opens the latest chat, or makes the first one.
export default async function ChatIndexPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  await requireCandidate(userId);
  const phone = await requireHrPhone(userId);

  const [latest] = listThreads(userId, phone);
  const thread = latest ?? getOrCreateEmptyThread(userId, phone);
  redirect(`/c/${userId}/chat/${thread.id}`);
}
