import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { ResumeUpload } from "@/components/ResumeUpload";
import { requireSession } from "@/lib/auth";
import { getResumes } from "@/lib/backend";

export const metadata: Metadata = { title: "Dashboard | Resume Assistant" };

const STEPS = [
  { name: "Upload", detail: "Your file is stored privately. Only you can see it." },
  { name: "We read it", detail: "AI picks out your skills, experience, contact details and certificates." },
  { name: "Test the chat", detail: "Ask up to 8 questions, the way HR would, and check the answers." },
  { name: "Share with HR", detail: "Send one link. HR asks questions and can book a call with you." },
];

// URL: /dashboard
// With resumes: open the newest one. Without: show the first upload.
export default async function DashboardPage() {
  const { user, token } = await requireSession();
  const resumes = await getResumes(token);

  const newest = resumes.items[0]; // the list is newest first
  // redirect() works by throwing, so nothing below runs after it.
  if (newest) redirect(`/dashboard/resumes/${newest.id}`);

  const firstName = user.name.split(" ")[0];

  return (
    <>
      <AppHeader user={user} resumeId={null} active="resume" />
      <main className="mx-auto flex w-full max-w-[760px] flex-col gap-6 px-4 py-10 md:py-16">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-3xl font-semibold">Hi {firstName}, let’s add your resume</h1>
          <p className="text-muted">We read it, write a clear summary, and get it ready for HR questions.</p>
        </div>

        {resumes.unavailableReason ? (
          <div role="status" className="rounded-xl border border-warn-line bg-warn-soft p-4 text-warn">
            <p className="font-semibold">Resume upload is not switched on yet</p>
            <p className="mt-1 text-sm">{resumes.unavailableReason}</p>
          </div>
        ) : null}

        <section className="rounded-xl border border-line bg-white p-6">
          <ResumeUpload disabled={Boolean(resumes.unavailableReason)} size="large" />
        </section>

        <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,160px),1fr))] gap-3">
          {STEPS.map((step, index) => (
            <li key={step.name} className="flex flex-col gap-2 rounded-xl border border-line bg-white p-4">
              <span className="flex size-6 items-center justify-center rounded-full bg-accent-soft font-mono text-xs font-medium text-accent-strong">
                {index + 1}
              </span>
              <span className="text-sm font-semibold">{step.name}</span>
              <span className="text-[13px] leading-snug text-muted">{step.detail}</span>
            </li>
          ))}
        </ol>
      </main>
    </>
  );
}
