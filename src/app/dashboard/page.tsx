import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { logout } from "@/app/actions";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { ResumeUpload } from "@/components/ResumeUpload";
import { requireUser } from "@/lib/auth";
import { getHrActivity, getMyResume } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Dashboard | Resume Assistant" };

// LEARN (routing): The folder name makes the URL, so this page is "/dashboard".
// LEARN (Server Component): This has no "use client", so it runs only on the server.
// It can be async and can get data directly with await.
export default async function DashboardPage() {
  // Real user from the backend (GET /api/me). Not logged in? requireUser goes to "/".
  const user = await requireUser();
  const firstName = user.name.split(" ")[0];
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Still sample data. Step 3 links your account to your own resume.
  const resume = await getMyResume();
  const activity = await getHrActivity();

  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const sharePath = `/c/${resume.userId}`;
  const shareLink = `${protocol}://${host}${sharePath}`;

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white px-4 py-3 md:px-12">
        <div className="font-semibold">Resume Assistant</div>
        <div className="flex min-w-0 items-center gap-3 text-sm">
          <div
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white"
          >
            {initials}
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="font-medium break-words">{user.name}</span>
            <span className="text-muted break-all">{user.email}</span>
          </div>
          {/* A form can call a Server Action directly. */}
          <form action={logout}>
            <button type="submit" className="inline-flex min-h-11 items-center px-2 text-accent underline">
              Log out
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto flex max-w-[1240px] flex-col gap-6 p-4 md:p-12">
        <h1 className="text-3xl font-semibold">Hi, {firstName}</h1>

        <div className="flex flex-wrap gap-6">
          <section className="flex min-w-0 flex-[1_1_420px] flex-col gap-5 rounded-xl border border-line bg-white p-6">
            <h2 className="text-xl font-semibold">Resume and work history</h2>
            <ResumeUpload fileName={resume.fileName} />
          </section>

          <section className="flex min-w-0 flex-[1_1_420px] flex-col gap-5 rounded-xl border border-line bg-white p-6">
            <h2 className="text-xl font-semibold">Share with HR</h2>
            <div className="flex flex-col gap-2">
              <label htmlFor="share-link" className="text-sm font-medium">
                Your link
              </label>
              <div className="flex flex-wrap gap-2">
                <input
                  id="share-link"
                  readOnly
                  value={shareLink}
                  className="min-h-11 min-w-0 flex-[1_1_240px] rounded-lg border border-line-strong bg-ground px-3 font-mono text-sm"
                />
                {/* A Server Component can show a Client Component and pass it data. */}
                <CopyLinkButton link={shareLink} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0 rounded-lg bg-ground p-4">
                <div className="text-sm text-muted">User ID</div>
                <div className="mt-1 font-mono text-sm font-medium break-words">{resume.userId}</div>
              </div>
              <div className="min-w-0 rounded-lg bg-ground p-4">
                <div className="text-sm text-muted">Limit for each HR</div>
                <div className="mt-1 font-medium">20 questions a day</div>
              </div>
            </div>
            <Link
              href={sharePath}
              className="flex min-h-11 items-center justify-center rounded-lg border border-ink px-4 font-medium hover:bg-ground"
            >
              Open the HR view
            </Link>
          </section>
        </div>

        <section className="flex flex-col gap-4 rounded-xl border border-line bg-white p-6">
          <h2 className="text-xl font-semibold">Recent HR activity (sample)</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <thead className="text-muted">
                <tr className="border-b border-line">
                  <th scope="col" className="py-2 pr-3 font-medium">HR phone</th>
                  <th scope="col" className="p-2 font-medium">Questions today</th>
                  <th scope="col" className="p-2 font-medium">Last topic</th>
                  <th scope="col" className="py-2 pl-3 font-medium">Interview</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((row) => (
                  <tr key={row.phone} className="border-b border-off-soft last:border-0">
                    <td className="py-3 pr-3 font-mono">{row.phone}</td>
                    <td className="p-2">{row.questionsToday}</td>
                    <td className="p-2">{row.lastTopic}</td>
                    <td className="py-3 pl-3">{row.interview}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  );
}
