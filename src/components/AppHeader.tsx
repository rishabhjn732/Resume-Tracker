import Link from "next/link";
import { logout } from "@/app/actions";
import { initials } from "@/lib/format";
import type { User } from "@/lib/types";

export type AppTab = "resume" | "chat" | "hr";

type Props = {
  user: User;
  // The tabs open pages for THIS resume. null: the user has no resume yet.
  resumeId: number | null;
  active: AppTab;
};

const TABS: { key: AppTab; label: string; path: string }[] = [
  { key: "resume", label: "My resume", path: "" },
  { key: "chat", label: "Test chat", path: "/chat" },
  { key: "hr", label: "HR and interviews", path: "/hr" },
];

const tabBase =
  "inline-flex min-h-14 items-center border-b-2 px-3.5 text-[15px] no-underline md:min-h-16";

// The top bar on every candidate page. A Server Component: no "use client".
export function AppHeader({ user, resumeId, active }: Props) {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-x-6 px-4 md:px-12">
        <div className="flex min-w-0 flex-wrap items-center gap-x-8">
          <Link
            href="/dashboard"
            className="flex min-h-14 items-center gap-2.5 font-semibold text-ink no-underline hover:text-ink md:min-h-16"
          >
            <span
              aria-hidden="true"
              className="flex size-7 items-center justify-center rounded-lg bg-accent text-xs font-semibold text-white"
            >
              RA
            </span>
            Resume Assistant
          </Link>

          <nav aria-label="Main" className="-mb-px flex flex-wrap">
            {TABS.map((tab) => {
              const isActive = tab.key === active;
              // Without a resume, only "My resume" can open.
              if (resumeId === null && tab.key !== "resume") {
                return (
                  <span
                    key={tab.key}
                    aria-disabled="true"
                    title="Upload a resume first"
                    className={`${tabBase} border-transparent text-line-strong`}
                  >
                    {tab.label}
                  </span>
                );
              }
              const href = resumeId === null ? "/dashboard" : `/dashboard/resumes/${resumeId}${tab.path}`;
              return (
                <Link
                  key={tab.key}
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={
                    isActive
                      ? `${tabBase} border-accent font-semibold text-accent`
                      : `${tabBase} border-transparent font-medium text-muted hover:text-ink`
                  }
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex min-h-14 items-center gap-2.5 text-sm">
          <span
            aria-hidden="true"
            className="flex size-[34px] items-center justify-center rounded-full bg-accent-soft text-[13px] font-semibold text-accent-strong"
          >
            {initials(user.name)}
          </span>
          <span className="font-medium">{user.name}</span>
          {/* A form can call a Server Action directly. */}
          <form action={logout}>
            <button type="submit" className="inline-flex min-h-11 items-center px-2 text-muted underline hover:text-ink">
              Log out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
