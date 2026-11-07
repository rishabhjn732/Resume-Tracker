import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { ResumeView } from "@/components/ResumeView";
import { requireSession } from "@/lib/auth";
import { getResume, getResumes } from "@/lib/backend";

export const metadata: Metadata = { title: "My resume | Resume Assistant" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ removed?: string | string[] }>;
};

// URL: /dashboard/resumes/12  (the "My resume" tab)
// The server loads the resume and the list once. Then ResumeView (a Client Component)
// asks for updates every second while the resume is still being read.
export default async function ResumePage({ params, searchParams }: Props) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const { user, token } = await requireSession();
  // LEARN: Promise.all runs both backend calls at the same time, not one after the other.
  const [resume, list] = await Promise.all([getResume(token, Number(id)), getResumes(token)]);
  if (!resume) notFound(); // not there, or it belongs to someone else

  // Names of old resumes removed by the 40 limit, sent by the upload box.
  const { removed } = await searchParams;
  const removedFileNames = removed === undefined ? [] : Array.isArray(removed) ? removed : [removed];

  return (
    <>
      <AppHeader user={user} resumeId={resume.id} active="resume" />
      <main className="mx-auto w-full max-w-[1320px] px-4 py-6 md:px-12 md:py-10">
        <ResumeView key={resume.id} initial={resume} list={list} removedFileNames={removedFileNames} />
      </main>
    </>
  );
}
