"use client";

import { useState } from "react";
import { AvailabilityEditor } from "@/components/AvailabilityEditor";
import { CalendarCard } from "@/components/CalendarCard";
import { ResumePicker } from "@/components/ResumePicker";
import { dateParts, formatDate, formatTimeRange } from "@/lib/format";
import type { HrInterview, HrOverview, ResumeListItem, ResumeStatus } from "@/lib/types";

type Props = {
  resumeId: number;
  resumes: ResumeListItem[];
  status: ResumeStatus;
  // null: the backend has no HR API yet.
  overview: HrOverview | null;
  origin: string; // like "https://my-resume-tracker.vercel.app"
  calendarNotice: "connected" | "error" | null;
};

function HowItWorks({ dailyLimit }: { dailyLimit: number }) {
  const steps = [
    "HR opens the link and enters a phone number.",
    `Each HR can ask ${dailyLimit} questions a day.`,
    "HR can book a 30-minute call in your free times.",
  ];
  return (
    <ol className="flex min-w-0 flex-[2_1_280px] flex-col gap-3 rounded-[10px] bg-ground px-5 py-[18px] text-sm leading-snug">
      {steps.map((text, index) => (
        <li key={text} className="flex gap-2.5">
          <span
            aria-hidden="true"
            className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-accent-soft font-mono text-xs font-medium text-accent-strong"
          >
            {index + 1}
          </span>
          {text}
        </li>
      ))}
    </ol>
  );
}

// "Add to calendar": make a small .ics file in the browser. Every calendar app can open it.
function calendarFile(interview: HrInterview) {
  const stamp = (value: string) => new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Resume Assistant//EN",
    "BEGIN:VEVENT",
    `UID:interview-${interview.id}@resume-assistant`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(interview.startsAt)}`,
    `DTEND:${stamp(interview.endsAt)}`,
    "SUMMARY:Call with HR",
    `DESCRIPTION:HR ${interview.hrPhone}${interview.topics.length ? `. Asked about: ${interview.topics.join(", ")}` : ""}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar" }));
}

function InterviewItem({ interview }: { interview: HrInterview }) {
  const date = dateParts(interview.startsAt);
  const upcoming = interview.status === "booked";
  const statusLook =
    interview.status === "booked"
      ? "bg-ok-soft text-ok"
      : interview.status === "cancelled"
        ? "bg-warn-soft text-warn"
        : "bg-off-soft text-muted";
  const statusText = interview.status === "booked" ? "Booked" : interview.status === "cancelled" ? "Cancelled" : "Done";

  function addToCalendar() {
    const url = calendarFile(interview);
    const link = document.createElement("a");
    link.href = url;
    link.download = `interview-${date.day}-${date.month}.ics`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <li className="flex gap-4 rounded-[10px] border border-line p-4">
      <div
        className={`flex h-[68px] w-16 shrink-0 flex-col items-center justify-center rounded-[10px] ${upcoming ? "bg-accent-soft text-accent-strong" : "bg-ground text-muted"}`}
        suppressHydrationWarning
      >
        <span className="text-xs font-medium">{date.month}</span>
        <span className="text-2xl leading-tight font-semibold">{date.day}</span>
        <span className="text-xs">{date.weekday}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <span className="text-base font-semibold" suppressHydrationWarning>
            {formatTimeRange(interview.startsAt, interview.endsAt)}
          </span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusLook}`}>{statusText}</span>
        </div>
        <span className="text-sm">
          <span className="font-medium">{interview.hrName}</span>{" "}
          <span className="break-all text-muted">· {interview.hrEmail}</span>
        </span>
        <span className="font-mono text-sm text-muted">HR {interview.hrPhone}</span>
        {interview.topics.length > 0 ? (
          <span className="text-sm text-muted">Asked about: {interview.topics.join("; ")}</span>
        ) : null}
        {interview.calendarNote ? <span className="text-sm text-warn">{interview.calendarNote}</span> : null}
        {upcoming ? (
          <div className="flex flex-wrap gap-x-4">
            {interview.meetLink ? (
              <a href={interview.meetLink} target="_blank" rel="noreferrer" className="inline-flex min-h-8 items-center text-sm font-medium">
                Join Google Meet
              </a>
            ) : null}
            {!interview.meetLink ? (
              <button
                type="button"
                onClick={addToCalendar}
                className="min-h-8 text-sm font-medium text-accent underline"
              >
                Add to calendar
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </li>
  );
}

export function HrOverviewView({ resumeId, resumes, status, overview, origin, calendarNotice }: Props) {
  const [linkEnabled, setLinkEnabled] = useState(overview?.linkEnabled ?? false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [error, setError] = useState<string | null>(null);

  const title = (
    <div className="flex flex-col gap-1.5">
      <h1 className="text-[28px] font-semibold">HR and interviews</h1>
      <p className="text-base text-muted">Share one link. HR asks questions about your resume and can book a call with you.</p>
    </div>
  );

  if (overview === null) {
    return (
      <div className="flex flex-col gap-6">
        {title}
        <section className="flex flex-wrap gap-x-10 gap-y-6 rounded-xl border border-line bg-white px-7 py-6">
          <div className="flex min-w-0 flex-[3_1_440px] flex-col gap-3">
            <h2 className="text-[19px] font-semibold">HR sharing is not switched on yet</h2>
            <p className="text-[15px] leading-relaxed text-muted">
              This page is ready, but the backend has no HR link API yet. When it is added, your link, interviews and
              the HR people who asked questions show here.
            </p>
            <ResumePicker label="Resume HR will see" resumes={resumes} selectedId={resumeId} page="hr" />
          </div>
          <HowItWorks dailyLimit={20} />
        </section>
      </div>
    );
  }

  const shareUrl = `${origin}/hr/${overview.shareId}`;
  const upcoming = overview.interviews.filter((interview) => interview.status === "booked");
  const past = overview.interviews.filter((interview) => interview.status !== "booked");
  const shown = tab === "upcoming" ? upcoming : past;

  async function toggleLink() {
    const next = !linkEnabled;
    setLinkEnabled(next); // show it at once, and undo if saving fails
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/resumes/${resumeId}/hr`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkEnabled: next }),
      });
      if (!response.ok) throw new Error();
    } catch {
      setLinkEnabled(!next);
      setError("Could not change the link. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const tabButton = (value: "upcoming" | "past", label: string, count: number) => (
    <button
      type="button"
      onClick={() => setTab(value)}
      aria-pressed={tab === value}
      className={`min-h-9 rounded-[7px] px-3 text-sm font-medium ${tab === value ? "bg-white shadow-sm" : "text-muted hover:text-ink"}`}
    >
      {label} <span className="text-muted">{count}</span>
    </button>
  );

  return (
    <div className="flex flex-col gap-6">
      {title}

      <section
        aria-labelledby="share-title"
        className="flex flex-wrap gap-x-10 gap-y-6 rounded-xl border border-line bg-white px-6 py-6 md:px-7"
      >
        <div className="flex min-w-0 flex-[3_1_440px] flex-col gap-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="share-title" className="text-[19px] font-semibold">
              Your HR link
            </h2>
            <button
              type="button"
              role="switch"
              aria-checked={linkEnabled}
              onClick={toggleLink}
              disabled={saving}
              className="inline-flex min-h-10 items-center gap-2.5 rounded-full border border-line bg-white py-1 pr-1 pl-3 text-sm font-medium disabled:opacity-60"
            >
              <span>{linkEnabled ? "Link is on" : "Link is paused"}</span>
              <span
                aria-hidden="true"
                className={`flex h-6 w-10 rounded-full p-[3px] transition-colors ${linkEnabled ? "justify-end bg-accent" : "justify-start bg-line-strong"}`}
              >
                <span className="size-[18px] rounded-full bg-white" />
              </span>
            </button>
          </div>

          <ResumePicker label="Resume HR will see" resumes={resumes} selectedId={resumeId} page="hr" />

          <div className="flex flex-wrap gap-2">
            <label htmlFor="hr-link" className="sr-only">
              Your HR link
            </label>
            <input
              id="hr-link"
              readOnly
              value={shareUrl}
              onFocus={(event) => event.target.select()}
              className="min-h-[46px] min-w-0 flex-[1_1_260px] rounded-lg border border-line-strong bg-ground px-3 font-mono text-sm"
            />
            <button
              type="button"
              onClick={copy}
              className="min-h-[46px] rounded-lg bg-accent px-5 text-[15px] font-medium text-white hover:bg-accent-strong"
            >
              <span aria-live="polite">{copied ? "Copied" : "Copy link"}</span>
            </button>
            <a
              href={`/hr/${overview.shareId}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[46px] items-center rounded-lg border border-ink px-[18px] text-[15px] font-medium text-ink no-underline hover:bg-ground hover:text-ink"
            >
              Preview as HR
            </a>
          </div>

          {!linkEnabled ? (
            <p role="status" className="rounded-lg bg-warn-soft px-3.5 py-2.5 text-sm text-warn">
              The link is paused. HR sees a message that the chat is closed.
            </p>
          ) : status !== "ready" ? (
            <p role="status" className="rounded-lg bg-warn-soft px-3.5 py-2.5 text-sm text-warn">
              {status === "processing"
                ? "This resume is still being read. HR can ask questions when it is ready."
                : "This resume could not be read, so HR can’t ask about it. Upload it again."}
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="text-sm text-warn">
              {error}
            </p>
          ) : null}
        </div>
        <HowItWorks dailyLimit={overview.dailyQuestionLimit} />
      </section>

      <div className="flex flex-wrap items-stretch gap-6">
        <CalendarCard status={overview.calendar} returnTo={`/dashboard/resumes/${resumeId}/hr`} notice={calendarNotice} />
        <AvailabilityEditor availability={overview.availability} freeTimes={overview.freeTimes} />
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <section
          aria-labelledby="interviews-title"
          className="flex min-w-0 flex-[1_1_440px] flex-col gap-4 rounded-xl border border-line bg-white p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="interviews-title" className="text-[19px] font-semibold">
              Interviews
            </h2>
            <div role="group" aria-label="Which interviews" className="inline-flex rounded-[9px] bg-ground p-[3px]">
              {tabButton("upcoming", "Upcoming", upcoming.length)}
              {tabButton("past", "Past", past.length)}
            </div>
          </div>
          {shown.length === 0 ? (
            <p className="rounded-lg bg-ground p-4 text-sm leading-normal text-muted">
              {tab === "upcoming"
                ? "No interviews yet. When HR books a call in the chat, it shows here."
                : "No past interviews."}
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {shown.map((interview) => (
                <InterviewItem key={interview.id} interview={interview} />
              ))}
            </ul>
          )}
        </section>

        <section
          aria-labelledby="activity-title"
          className="flex min-w-0 flex-[1_1_480px] flex-col gap-3 rounded-xl border border-line bg-white p-6"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="activity-title" className="text-[19px] font-semibold">
              HR who asked questions
            </h2>
            <span className="text-[13px] text-muted">{overview.people.length} people</span>
          </div>
          {overview.people.length === 0 ? (
            <p className="rounded-lg bg-ground p-4 text-sm leading-normal text-muted">
              No HR has used your link yet. Copy the link above and send it to a recruiter.
            </p>
          ) : (
            <ul className="flex flex-col">
              {overview.people.map((person, index) => {
                const percent = Math.min(100, Math.round((person.questionsToday / overview.dailyQuestionLimit) * 100));
                const full = person.questionsToday >= overview.dailyQuestionLimit;
                return (
                  <li
                    key={`${person.phone}-${index}`}
                    className={`flex flex-wrap items-center gap-x-4 gap-y-2 py-3.5 ${index < overview.people.length - 1 ? "border-b border-off-soft" : ""}`}
                  >
                    <div className="flex min-w-0 flex-[1_1_200px] flex-col gap-0.5">
                      <span className="font-mono text-sm font-medium">{person.phone}</span>
                      <span className="text-sm text-muted">
                        {person.lastTopic ? `Last asked: ${person.lastTopic}` : "No questions yet"}
                      </span>
                    </div>
                    <div className="flex w-[120px] flex-col gap-1.5">
                      <span className="text-[13px]">
                        {person.questionsToday} of {overview.dailyQuestionLimit} today
                      </span>
                      <div
                        role="img"
                        aria-label={`${person.questionsToday} of ${overview.dailyQuestionLimit} questions used today`}
                        className="h-1.5 rounded-full bg-off-soft"
                      >
                        <div
                          className={`h-1.5 rounded-full ${full ? "bg-[#b85c00]" : "bg-accent"}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-[150px] text-right text-[13px] text-muted" suppressHydrationWarning>
                      {formatDate(person.lastSeenAt)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
