import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { TestChat } from "@/components/TestChat";
import { requireSession } from "@/lib/auth";
import { getResume, getResumes, getTestChat } from "@/lib/backend";

export const metadata: Metadata = { title: "Test chat | Resume Assistant" };

type Props = { params: Promise<{ id: string }> };

// URL: /dashboard/resumes/12/chat  (the "Test chat" tab)
// The candidate asks up to 8 questions, the way HR would, to check the answers.
export default async function TestChatPage({ params }: Props) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const { user, token } = await requireSession();
  const [resume, list] = await Promise.all([getResume(token, Number(id)), getResumes(token)]);
  if (!resume) notFound();

  // Only a ready resume can be searched.
  const chat = resume.status === "ready" ? await getTestChat(token, resume.id) : null;
  const firstName = resume.summary?.fullName?.split(" ")[0] ?? null;

  return (
    <>
      <AppHeader user={user} resumeId={resume.id} active="chat" />
      <main className="mx-auto w-full max-w-[1320px] px-4 py-6 md:px-12 md:py-8">
        <TestChat
          key={resume.id}
          resumeId={resume.id}
          resumes={list.items}
          status={resume.status}
          initial={chat}
          firstName={firstName}
        />
      </main>
    </>
  );
}
