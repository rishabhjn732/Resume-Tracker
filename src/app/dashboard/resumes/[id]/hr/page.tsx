import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { HrOverviewView } from "@/components/HrOverviewView";
import { requireSession } from "@/lib/auth";
import { getHrOverview, getResume, getResumes } from "@/lib/backend";

export const metadata: Metadata = { title: "HR and interviews | Resume Assistant" };

type Props = { params: Promise<{ id: string }> };

// The site's own address, like "https://my-resume-tracker.vercel.app", to build the share link.
// Vercel sends the real host in x-forwarded-host.
async function siteOrigin() {
  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host") ?? "localhost:3000";
  const protocol = list.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

// URL: /dashboard/resumes/12/hr  (the "HR and interviews" tab)
export default async function HrPage({ params }: Props) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const { user, token } = await requireSession();
  const [resume, list, overview, origin] = await Promise.all([
    getResume(token, Number(id)),
    getResumes(token),
    getHrOverview(token, Number(id)),
    siteOrigin(),
  ]);
  if (!resume) notFound();

  return (
    <>
      <AppHeader user={user} resumeId={resume.id} active="hr" />
      <main className="mx-auto w-full max-w-[1240px] px-4 py-6 md:px-12 md:py-10">
        <HrOverviewView
          key={resume.id}
          resumeId={resume.id}
          resumes={list.items}
          status={resume.status}
          overview={overview}
          origin={origin}
        />
      </main>
    </>
  );
}
