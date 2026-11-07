"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ResumePicker } from "@/components/ResumePicker";
import { Spinner } from "@/components/icons";
import type { ChatStep, ResumeListItem, ResumeStatus, TestChat as TestChatData, TestChatMessage, Verdict } from "@/lib/types";

type Props = {
  resumeId: number;
  resumes: ResumeListItem[];
  status: ResumeStatus;
  // null: the backend has no test chat API yet.
  initial: TestChatData | null;
  firstName: string | null;
};

// While we wait for the answer, these "thinking" lines move forward one by one.
const THINKING = ["Checking the question", "Searching your resume", "Writing the answer"];

const tagStyle: Record<ChatStep["status"], string> = {
  passed: "bg-accent-soft text-accent-strong",
  warning: "bg-warn-soft text-warn",
  skipped: "bg-off-soft text-muted",
};

function suggestionsFor(firstName: string | null) {
  const name = firstName ?? "this person";
  return [
    `What is ${name}'s total experience?`,
    `Has ${name} led a team?`,
    "Which cloud tools are listed?",
    "What is the notice period?",
    "Write me a Python sorting program",
  ];
}

function sourceTitle(message: TestChatMessage) {
  if (message.outcome === "blocked") return "Stopped by the guardrail";
  if (message.outcome === "not_found" || message.sources.length === 0) return "No part of the resume answers this";
  return "From your resume:";
}

function uniqueSections(message: TestChatMessage) {
  return [...new Set(message.sources.map((source) => source.section))];
}

// A card shown instead of the chat when it can't be used yet.
function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-line bg-white p-6 md:p-8">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="flex flex-col gap-3 text-[15px] leading-relaxed text-muted">{children}</div>
    </section>
  );
}

function Steps({ steps }: { steps: { label: string; tag: string; detail: string; status: ChatStep["status"] }[] }) {
  return (
    <ol className="flex flex-col">
      {steps.map((step, index) => (
        <li key={`${step.label}-${index}`} className="flex gap-3">
          <div className="flex w-6 shrink-0 flex-col items-center">
            <span
              className={`flex size-6 items-center justify-center rounded-full font-mono text-xs font-medium ${tagStyle[step.status]}`}
            >
              {index + 1}
            </span>
            {index < steps.length - 1 ? <div className="min-h-3 w-px flex-1 bg-line" /> : null}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <span className="text-sm font-semibold">{step.label}</span>
              {step.tag ? (
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tagStyle[step.status]}`}>{step.tag}</span>
              ) : null}
            </div>
            <span className="text-[13px] leading-snug text-muted">{step.detail}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function TestChat({ resumeId, resumes, status, initial, firstName }: Props) {
  const [chat, setChat] = useState<TestChatData | null>(initial);
  const [pending, setPending] = useState<string | null>(null);
  const [thinkingStep, setThinkingStep] = useState(0);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Move the "thinking" line forward while we wait.
  useEffect(() => {
    if (pending === null) return;
    const timer = setInterval(() => setThinkingStep((step) => Math.min(step + 1, THINKING.length - 1)), 1500);
    return () => clearInterval(timer);
  }, [pending]);

  // Keep the newest message in view.
  const messageCount = chat?.messages.length ?? 0;
  useEffect(() => {
    if (messageCount > 0 || pending) endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [messageCount, pending]);

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-off-soft px-6 py-5">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-[22px] font-semibold">Test chat</h1>
        <p className="text-sm leading-normal text-muted">Ask what HR might ask, and mark each answer right or wrong.</p>
        <div className="mt-1.5">
          <ResumePicker label="Resume" resumes={resumes} selectedId={resumeId} page="chat" />
        </div>
      </div>
      {chat ? (
        <div className="flex flex-col items-end gap-2">
          <span className="text-sm">
            <strong className="font-semibold">
              {chat.used} of {chat.limit}
            </strong>{" "}
            test questions used
          </span>
          <div role="img" aria-label={`${chat.used} of ${chat.limit} test questions used`} className="flex gap-1">
            {Array.from({ length: chat.limit }, (_, index) => (
              <div
                key={index}
                className={`h-2 w-[22px] rounded ${index < chat.used ? (chat.used >= chat.limit ? "bg-[#b85c00]" : "bg-accent") : "bg-off-soft"}`}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );

  if (status !== "ready" || chat === null) {
    return (
      <div className="flex flex-col gap-5">
        <section className="rounded-xl border border-line bg-white">{header}</section>
        {status === "processing" ? (
          <Notice title="Your resume is still being read">
            <p>The test chat opens when it is ready. This takes about a minute.</p>
            <Link href={`/dashboard/resumes/${resumeId}`} className="self-start">
              See the progress
            </Link>
          </Notice>
        ) : status === "failed" ? (
          <Notice title="This resume could not be read">
            <p>Upload the file again on the My resume page, then test the chat.</p>
            <Link href={`/dashboard/resumes/${resumeId}`} className="self-start">
              Go to My resume
            </Link>
          </Notice>
        ) : (
          <Notice title="The test chat is not switched on yet">
            <p>
              This page is ready, but the backend does not answer questions yet. It needs the chat API: search the
              resume, then write the answer from the parts it found. That is the next backend step.
            </p>
            <p>When it is on, you can ask 8 questions here and mark each answer right or wrong.</p>
          </Notice>
        )}
      </div>
    );
  }

  const atLimit = chat.used >= chat.limit;
  const last = chat.messages.at(-1) ?? null;
  const asked = new Set(chat.messages.map((message) => message.question.trim().toLowerCase()));
  const suggestions = suggestionsFor(firstName).filter((question) => !asked.has(question.toLowerCase()));
  const rightCount = chat.messages.filter((message) => message.verdict === "right").length;
  const wrongCount = chat.messages.filter((message) => message.verdict === "wrong").length;

  async function ask(question: string) {
    const text = question.trim();
    if (!text || pending !== null || atLimit) return;
    setPending(text);
    setThinkingStep(0);
    setDraft("");
    setError(null);
    try {
      const response = await fetch(`/api/resumes/${resumeId}/test-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      });
      const body = await response.json().catch(() => null);
      if (response.status === 429) {
        // The backend says the 8 questions are used up.
        setChat((current) => (current ? { ...current, used: current.limit } : current));
        setError(typeof body?.detail === "string" ? body.detail : "You have used all your test questions.");
        return;
      }
      if (!response.ok || !body?.id) {
        setDraft(text); // give the question back, so it can be sent again
        setError(typeof body?.detail === "string" ? body.detail : "The chat did not answer. Please try again.");
        return;
      }
      const message = body as TestChatMessage;
      setChat((current) =>
        current ? { ...current, used: current.used + 1, messages: [...current.messages, message] } : current,
      );
    } catch {
      setDraft(text);
      setError("Network error. Check your internet and try again.");
    } finally {
      setPending(null);
    }
  }

  async function mark(message: TestChatMessage, value: Verdict) {
    const verdict = message.verdict === value ? null : value; // a second click clears it
    const update = (to: Verdict | null) =>
      setChat((current) =>
        current
          ? { ...current, messages: current.messages.map((item) => (item.id === message.id ? { ...item, verdict: to } : item)) }
          : current,
      );
    update(verdict); // show it at once, and undo if saving fails
    try {
      const response = await fetch(`/api/resumes/${resumeId}/test-chat/${message.id}/feedback`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verdict }),
      });
      if (!response.ok) throw new Error();
    } catch {
      update(message.verdict);
      setError("Could not save your check. Please try again.");
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(draft);
  }

  const verdictButton = (message: TestChatMessage, value: Verdict, label: string) => {
    const on = message.verdict === value;
    const look = on
      ? value === "right"
        ? "border-ok bg-ok-soft text-ok"
        : "border-warn bg-warn-soft text-warn"
      : "border-line bg-white text-ink hover:bg-ground";
    return (
      <button
        type="button"
        onClick={() => mark(message, value)}
        aria-pressed={on}
        className={`min-h-9 rounded-lg border px-3 text-[13px] font-medium ${look}`}
      >
        {label}
      </button>
    );
  };

  const asideSteps =
    pending !== null
      ? THINKING.map((label, index) => ({
          label,
          tag: index < thinkingStep ? "Done" : index === thinkingStep ? "Now" : "",
          detail: index === thinkingStep ? "Working…" : index < thinkingStep ? "Finished." : "Waiting.",
          status: (index <= thinkingStep ? "passed" : "skipped") as ChatStep["status"],
        }))
      : (last?.steps ?? []);

  return (
    <div className="flex flex-wrap items-start gap-6">
      <section aria-label="Test chat" className="flex min-w-0 flex-[999_1_560px] flex-col rounded-xl border border-line bg-white">
        {header}

        <div className="flex flex-col gap-7 p-6">
          {chat.messages.length === 0 && pending === null ? (
            <p className="rounded-lg bg-ground p-4 text-[15px] leading-relaxed text-muted">
              No questions yet. Try one of the questions below, or type your own. Ask at least one question the resume
              can’t answer, to check that the chat says so instead of guessing.
            </p>
          ) : null}

          {chat.messages.map((message) => (
            <article key={message.id} className="flex flex-col gap-3">
              <p className="max-w-[80%] self-end rounded-[14px_14px_4px_14px] bg-ink px-4 py-3 text-[15px] leading-normal break-words text-white">
                {message.question}
              </p>
              {message.outcome === "blocked" ? (
                <p className="max-w-[88%] rounded-xl border border-warn-line bg-warn-soft px-4 py-3.5 text-[15px] leading-normal text-warn">
                  {message.answer}
                </p>
              ) : (
                <p className="max-w-[88%] text-base leading-relaxed whitespace-pre-line">{message.answer}</p>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
                  <span>{sourceTitle(message)}</span>
                  {message.outcome === "answered"
                    ? uniqueSections(message).map((section) => (
                        <span key={section} className="rounded-full bg-ground px-2.5 py-0.5 text-ink">
                          {section}
                        </span>
                      ))
                    : null}
                </div>
                <div role="group" aria-label="Is this answer right?" className="flex gap-1.5">
                  {verdictButton(message, "right", "Right")}
                  {verdictButton(message, "wrong", "Wrong")}
                </div>
              </div>
            </article>
          ))}

          {pending !== null ? (
            <article className="flex flex-col gap-3" aria-live="polite">
              <p className="max-w-[80%] self-end rounded-[14px_14px_4px_14px] bg-ink px-4 py-3 text-[15px] leading-normal break-words text-white">
                {pending}
              </p>
              <p className="flex items-center gap-2 text-[15px] text-accent-strong">
                <Spinner className="size-4" />
                <span className="text-shimmer">{THINKING[thinkingStep]}…</span>
              </p>
            </article>
          ) : null}
          <div ref={endRef} />
        </div>

        <div className="mt-auto flex flex-col gap-3 border-t border-off-soft px-6 py-5">
          {error ? (
            <p role="alert" className="rounded-lg border border-warn-line bg-warn-soft px-4 py-3 text-sm text-warn">
              {error}
            </p>
          ) : null}
          {atLimit ? (
            <p role="status" className="rounded-[10px] border border-warn-line bg-warn-soft px-4 py-3.5 text-sm leading-normal text-warn">
              You have used all {chat.limit} test questions for this resume. Upload a new version to test again.
            </p>
          ) : suggestions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => ask(question)}
                  disabled={pending !== null}
                  className="min-h-10 rounded-full border border-line-strong bg-white px-3.5 text-sm hover:bg-ground disabled:opacity-50"
                >
                  {question}
                </button>
              ))}
            </div>
          ) : null}
          <form onSubmit={onSubmit} className="flex gap-2">
            <label htmlFor="test-question" className="sr-only">
              Ask a test question
            </label>
            <input
              id="test-question"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              disabled={atLimit}
              maxLength={500}
              placeholder={`Ask like HR would, for example: Has ${firstName ?? "this person"} used Kafka?`}
              className="min-h-12 min-w-0 flex-1 rounded-lg border border-line-strong bg-white px-3.5 text-[15px] disabled:bg-ground"
            />
            <button
              type="submit"
              disabled={atLimit || pending !== null || draft.trim().length === 0}
              className="min-h-12 rounded-lg bg-accent px-[22px] text-[15px] font-medium text-white hover:bg-accent-strong disabled:opacity-50"
            >
              Send
            </button>
          </form>
          <span className="text-[13px] text-muted">
            {atLimit
              ? "No test questions left for this resume."
              : `${chat.limit - chat.used} test ${chat.limit - chat.used === 1 ? "question" : "questions"} left for this resume.`}
          </span>
        </div>
      </section>

      <aside aria-label="How the last answer was made" className="flex min-w-0 flex-[1_1_320px] flex-col gap-5 lg:sticky lg:top-6">
        <section className="flex flex-col gap-[18px] rounded-xl border border-line bg-white p-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold">How the last answer was made</h2>
            <span className="text-[13px] break-words text-muted">
              {pending !== null ? `For: ${pending}` : last ? `For: ${last.question}` : "Ask a question to see the steps."}
            </span>
          </div>
          {asideSteps.length > 0 ? <Steps steps={asideSteps} /> : null}
        </section>

        <section className="flex flex-col gap-3 rounded-xl border border-line bg-white p-5">
          <h2 className="text-base font-semibold">Your checks</h2>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-0.5 rounded-lg bg-ok-soft p-3">
              <span className="text-[22px] font-semibold text-ok">{rightCount}</span>
              <span className="text-xs text-ok">Right</span>
            </div>
            <div className="flex flex-col gap-0.5 rounded-lg bg-warn-soft p-3">
              <span className="text-[22px] font-semibold text-warn">{wrongCount}</span>
              <span className="text-xs text-warn">Wrong</span>
            </div>
            <div className="flex flex-col gap-0.5 rounded-lg bg-ground p-3">
              <span className="text-[22px] font-semibold">{chat.messages.length - rightCount - wrongCount}</span>
              <span className="text-xs text-muted">Not checked</span>
            </div>
          </div>
          <p className="text-[13px] leading-normal text-muted">
            HR sees the same answers, without this panel. Wrong answers help us fix the chat.
          </p>
        </section>
      </aside>
    </div>
  );
}
