"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { initials } from "@/lib/format";
import type { ResumeSummary } from "@/lib/types";

// ----- Small helpers -----

// Links come from the resume text, so we only allow safe kinds of links.
function webLink(value: string) {
  const text = value.trim();
  if (/^https?:\/\/\S+$/i.test(text)) return text;
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(text)) return `https://${text}`;
  return null;
}

function phoneLink(value: string) {
  const digits = value.replace(/[^\d+]/g, "");
  return digits.replace("+", "").length >= 7 ? `tel:${digits}` : null;
}

function emailLink(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? `mailto:${value.trim()}` : null;
}

function Card({ title, aside, children }: { title: ReactNode; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-xl border border-line bg-white px-6 py-6 md:px-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[19px] font-semibold">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-lg bg-ground p-3.5 text-sm leading-normal text-muted">{children}</p>;
}

// ----- Sections -----

function Profile({ summary, resumeId }: { summary: ResumeSummary; resumeId: number }) {
  const { contact } = summary;
  const chips: { label: string; value: string; href: string | null }[] = [];
  if (contact.phone) chips.push({ label: "Phone", value: contact.phone, href: phoneLink(contact.phone) });
  if (contact.email) chips.push({ label: "Email", value: contact.email, href: emailLink(contact.email) });
  if (contact.location) chips.push({ label: "Location", value: contact.location, href: null });
  if (contact.linkedin) chips.push({ label: "LinkedIn", value: contact.linkedin, href: webLink(contact.linkedin) });
  if (contact.github) chips.push({ label: "GitHub", value: contact.github, href: webLink(contact.github) });
  if (contact.website) chips.push({ label: "Website", value: contact.website, href: webLink(contact.website) });

  const subtitle = [summary.headline, summary.totalExperience ? `${summary.totalExperience} of experience` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <section className="flex flex-col gap-5 rounded-xl border border-line bg-white p-6 md:p-7">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-4">
        <div
          aria-hidden="true"
          className="flex size-16 shrink-0 items-center justify-center rounded-full bg-accent text-[22px] font-semibold text-white"
        >
          {initials(summary.fullName)}
        </div>
        <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-1">
          <h1 className="text-[28px] leading-tight font-semibold break-words">{summary.fullName ?? "Name not found"}</h1>
          {subtitle ? <p className="text-base text-muted">{subtitle}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link
            href={`/dashboard/resumes/${resumeId}/chat`}
            className="inline-flex min-h-11 items-center rounded-lg bg-accent px-[18px] text-[15px] font-medium text-white no-underline hover:bg-accent-strong hover:text-white"
          >
            Test the chat
          </Link>
          <Link
            href={`/dashboard/resumes/${resumeId}/hr`}
            className="inline-flex min-h-11 items-center rounded-lg border border-ink px-[18px] text-[15px] font-medium text-ink no-underline hover:bg-ground hover:text-ink"
          >
            Share with HR
          </Link>
        </div>
      </div>

      {chips.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <li
              key={chip.label}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-ground px-3 py-1.5 text-sm"
            >
              <span className="text-muted">{chip.label}</span>
              {chip.href ? (
                <a
                  href={chip.href}
                  target={chip.href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  className="break-all"
                >
                  {chip.value}
                </a>
              ) : (
                <span className="break-all">{chip.value}</span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <Empty>No contact details were found in this resume.</Empty>
      )}

      <p className="text-base leading-relaxed">{summary.overview}</p>
    </section>
  );
}

function Skills({ summary }: { summary: ResumeSummary }) {
  const [view, setView] = useState<"groups" | "list">("groups");
  const [copied, setCopied] = useState(false);
  const all = summary.skillGroups.flatMap((group) => group.skills);
  const commaList = all.join(", ");

  async function copy() {
    try {
      await navigator.clipboard.writeText(commaList);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const toggle = (value: "groups" | "list", label: string) => (
    <button
      type="button"
      onClick={() => setView(value)}
      aria-pressed={view === value}
      className={`min-h-[38px] rounded-[7px] px-3.5 text-sm font-medium ${view === value ? "bg-white shadow-sm" : "text-muted hover:text-ink"}`}
    >
      {label}
    </button>
  );

  return (
    <Card
      title={
        <>
          Skills <span className="text-sm font-medium text-muted">{all.length}</span>
        </>
      }
      aside={
        all.length > 0 ? (
          <div role="group" aria-label="Skills view" className="inline-flex rounded-[9px] bg-ground p-[3px]">
            {toggle("groups", "By group")}
            {toggle("list", "Comma list")}
          </div>
        ) : null
      }
    >
      {all.length === 0 ? (
        <Empty>No skills were found in this resume.</Empty>
      ) : view === "groups" ? (
        <div className="flex flex-col gap-4">
          {summary.skillGroups.map((group, groupIndex) => (
            <div key={`${group.category}-${groupIndex}`} className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
              <h3 className="flex-[0_0_180px] text-[13px] font-semibold text-muted">{group.category}</h3>
              <ul className="flex min-w-0 flex-[1_1_320px] flex-wrap gap-2">
                {group.skills.map((skill, index) => (
                  <li key={`${skill}-${index}`} className="rounded-full border border-line px-3 py-1 text-sm font-medium">
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-[10px] bg-ground p-4">
          <p className="font-mono text-sm leading-[1.7] break-words">{commaList}</p>
          <button
            type="button"
            onClick={copy}
            className="min-h-10 self-start rounded-lg border border-line-strong bg-white px-4 text-sm font-medium hover:bg-ground"
          >
            <span aria-live="polite">{copied ? "Copied" : "Copy skills"}</span>
          </button>
        </div>
      )}
    </Card>
  );
}

const SHORT_POINTS = 3;

function Job({ job, first, last }: { job: ResumeSummary["experiences"][number]; first: boolean; last: boolean }) {
  const [open, setOpen] = useState(false);
  const points = open ? job.highlights : job.highlights.slice(0, SHORT_POINTS);
  const hidden = job.highlights.length - SHORT_POINTS;

  return (
    <li className="flex gap-4">
      <div className="flex w-3 shrink-0 flex-col items-center pt-1.5">
        <div className={`size-3 rounded-full border-2 border-accent ${first ? "bg-accent" : "bg-white"}`} />
        {!last ? <div className="min-h-4 w-px flex-1 bg-line" /> : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 pb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h3 className="text-base font-semibold">
            {job.role}, {job.company}
          </h3>
          {job.start || job.end ? (
            <span className="font-mono text-[13px] text-muted">{[job.start, job.end].filter(Boolean).join(" – ")}</span>
          ) : null}
        </div>
        {job.location ? <span className="text-sm text-muted">{job.location}</span> : null}
        {points.length > 0 ? (
          <ul className="flex list-disc flex-col gap-1.5 pl-[18px] text-sm leading-relaxed">
            {points.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
        ) : null}
        {hidden > 0 ? (
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            className="min-h-8 self-start text-sm font-medium text-accent underline"
          >
            {open ? "Show less" : `Show ${hidden} more`}
          </button>
        ) : null}
      </div>
    </li>
  );
}

function Experience({ summary }: { summary: ResumeSummary }) {
  return (
    <Card title="Experience">
      {summary.experienceSummary ? <p className="text-[15px] leading-relaxed text-muted">{summary.experienceSummary}</p> : null}
      {summary.experiences.length === 0 ? (
        <Empty>No jobs were found in this resume.</Empty>
      ) : (
        <ol className="flex flex-col">
          {summary.experiences.map((job, index) => (
            <Job
              key={`${job.company}-${job.role}-${index}`}
              job={job}
              first={index === 0}
              last={index === summary.experiences.length - 1}
            />
          ))}
        </ol>
      )}
    </Card>
  );
}

function Education({ summary }: { summary: ResumeSummary }) {
  return (
    <Card title="Education">
      {summary.education.length === 0 ? (
        <Empty>No education was found in this resume.</Empty>
      ) : (
        <ul className="flex flex-col gap-4">
          {summary.education.map((item, index) => (
            <li key={`${item.degree}-${index}`} className="flex flex-col gap-0.5">
              <span className="text-[15px] font-semibold">{item.degree}</span>
              <span className="text-sm text-muted">{item.institution}</span>
              {item.year ? <span className="font-mono text-[13px] text-muted">{item.year}</span> : null}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function Certificates({ summary }: { summary: ResumeSummary }) {
  return (
    <Card title="Certificates">
      {summary.certifications.length === 0 ? (
        <Empty>No certificates found in this resume. Add them to the file and upload it again.</Empty>
      ) : (
        <ul className="flex flex-col gap-4">
          {summary.certifications.map((item, index) => (
            <li key={`${item.name}-${index}`} className="flex flex-col gap-0.5">
              <span className="text-[15px] font-semibold">{item.name}</span>
              {item.issuer || item.year ? (
                <span className="text-sm text-muted">{[item.issuer, item.year].filter(Boolean).join(" · ")}</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// ----- The whole resume -----

type Props = {
  summary: ResumeSummary;
  resumeId: number;
  // Extra cards for the right column, like the file details with the Delete button.
  side?: ReactNode;
};

export function ResumeSummaryView({ summary, resumeId, side }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <Profile summary={summary} resumeId={resumeId} />
      <Skills summary={summary} />
      <div className="flex flex-wrap items-start gap-5">
        <div className="flex min-w-0 flex-[2_1_460px] flex-col gap-5">
          <Experience summary={summary} />
        </div>
        <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-5">
          <Education summary={summary} />
          <Certificates summary={summary} />
          {side}
        </div>
      </div>
    </div>
  );
}
