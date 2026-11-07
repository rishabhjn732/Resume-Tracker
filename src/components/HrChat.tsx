"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { leaveHrChat } from "@/app/hr/[shareId]/actions";
import { Spinner } from "@/components/icons";
import { dateParts, formatTimeRange } from "@/lib/format";
import type { ChatStep, HrMe, HrMessage, HrThread, InterviewBrief, Slot } from "@/lib/types";

type Props = {
  shareId: string;
  me: HrMe;
  // null: no chat yet. The first question creates one.
  thread: HrThread | null;
};

const THINKING = ["Checking the question", "Choosing a path", "Working on it"];

const tagStyle: Record<ChatStep["status"], string> = {
  passed: "bg-accent-soft text-accent-strong",
  warning: "bg-warn-soft text-warn",
  skipped: "bg-off-soft text-muted",
};

function slotDay(value: string) {
  const parts = dateParts(value);
  return `${parts.weekday} ${parts.day} ${parts.month}`;
}

function sections(message: HrMessage) {
  return [...new Set(message.sources.map((source) => source.section))];
}

function Steps({ steps }: { steps: { label: string; tag: string; detail: string; status: ChatStep["status"] }[] }) {
  return (
    <ol className="flex flex-col">
      {steps.map((step, index) => (
        <li key={`${step.label}-${index}`} className="flex gap-3">
          <div className="flex w-6 shrink-0 flex-col items-center">
            <span className={`flex size-6 items-center justify-center rounded-full font-mono text-xs font-medium ${tagStyle[step.status]}`}>
              {index + 1}
            </span>
            {index < steps.length - 1 ? <div className="min-h-3 w-px flex-1 bg-line" /> : null}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <span className="text-sm font-semibold break-words">{step.label}</span>
              {step.tag ? (
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tagStyle[step.status]}`}>{step.tag}</span>
              ) : null}
            </div>
            <span className="text-[13px] leading-snug break-words text-muted">{step.detail}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}

// Free times from the check_availability tool. HR picks one, gives name and email, and confirms.
function SlotPicker({
  slots,
  onBook,
  busy,
}: {
  slots: Slot[];
  onBook: (slot: Slot, name: string, email: string) => void;
  busy: boolean;
}) {
  const [picked, setPicked] = useState<Slot | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line bg-white p-5">
      <h3 className="text-[15px] font-semibold">Free times (India time)</h3>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2.5">
        {slots.map((slot) => {
          const on = picked?.startsAt === slot.startsAt;
          return (
            <button
              key={slot.startsAt}
              type="button"
              onClick={() => setPicked(slot)}
              aria-pressed={on}
              className={`flex min-h-16 flex-col items-start justify-center rounded-lg border px-3 py-2 text-left ${on ? "border-accent bg-accent-soft" : "border-line-strong bg-white hover:bg-ground"}`}
            >
              <span className="text-sm font-semibold" suppressHydrationWarning>
                {slotDay(slot.startsAt)}
              </span>
              <span className="text-sm" suppressHydrationWarning>
                {formatTimeRange(slot.startsAt, slot.endsAt)}
              </span>
            </button>
          );
        })}
      </div>
      {picked ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onBook(picked, name, email);
          }}
          className="flex flex-col gap-3"
        >
          <p className="text-sm text-muted">The calendar invite goes to this email.</p>
          <div className="flex flex-wrap gap-2">
            <label className="flex min-w-0 flex-[1_1_180px] flex-col gap-1 text-sm font-medium">
              Your name
              <input
                required
                maxLength={100}
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                className="min-h-11 rounded-lg border border-line-strong bg-white px-3 text-[15px] font-normal"
              />
            </label>
            <label className="flex min-w-0 flex-[1_1_220px] flex-col gap-1 text-sm font-medium">
              Work email
              <input
                required
                type="email"
                maxLength={320}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                className="min-h-11 rounded-lg border border-line-strong bg-white px-3 text-[15px] font-normal"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="min-h-11 self-start rounded-lg bg-accent px-[18px] text-[15px] font-medium text-white hover:bg-accent-strong disabled:opacity-60"
          >
            <span suppressHydrationWarning>
              {busy ? "Booking…" : `Confirm ${slotDay(picked.startsAt)}, ${formatTimeRange(picked.startsAt, picked.endsAt)}`}
            </span>
          </button>
        </form>
      ) : null}
    </div>
  );
}

function BookedCard({ interview, firstName }: { interview: InterviewBrief; firstName: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-ok-soft p-4">
      <span className="text-sm font-semibold text-ok">Your call with {firstName}</span>
      <span className="text-[15px] font-medium" suppressHydrationWarning>
        {slotDay(interview.startsAt)}, {formatTimeRange(interview.startsAt, interview.endsAt)}
      </span>
      {interview.meetLink ? (
        <a href={interview.meetLink} target="_blank" rel="noreferrer" className="self-start text-sm font-medium">
          Join Google Meet
        </a>
      ) : null}
    </div>
  );
}

export function HrChat({ shareId, me, thread }: Props) {
  const router = useRouter();
  const base = `/hr/${encodeURIComponent(shareId)}`;
  const [messages, setMessages] = useState<HrMessage[]>(thread?.messages ?? []);
  const [used, setUsed] = useState(thread?.questionsUsedToday ?? me.questionsUsedToday);
  const [pending, setPending] = useState<string | null>(null);
  const [thinkingStep, setThinkingStep] = useState(0);
  const [booking, setBooking] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const limit = thread?.dailyQuestionLimit ?? me.dailyQuestionLimit;
  const atLimit = used >= limit;

  useEffect(() => {
    if (pending === null) return;
    const timer = setInterval(() => setThinkingStep((step) => Math.min(step + 1, THINKING.length - 1)), 1400);
    return () => clearInterval(timer);
  }, [pending]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [messages.length, pending]);

  const bookedMessage = [...messages].reverse().find((message) => message.interview);
  const upcoming = bookedMessage?.interview ?? me.booking;
  const lastSlotsId = [...messages].reverse().find((message) => message.outcome === "slots")?.id;
  const last = messages.at(-1) ?? null;

  async function newThread(): Promise<number | null> {
    const response = await fetch(`/api/hr/${encodeURIComponent(shareId)}/threads`, { method: "POST" });
    const body = await response.json().catch(() => null);
    if (response.status === 401) {
      router.push(base);
      return null;
    }
    if (!response.ok || !body?.id) {
      setError(typeof body?.detail === "string" ? body.detail : "Could not start a new chat.");
      return null;
    }
    return body.id;
  }

  async function startNewChat() {
    const id = await newThread();
    if (id) router.push(`${base}/chat/${id}`);
  }

  async function ask(question: string) {
    const text = question.trim();
    if (!text || pending !== null || atLimit) return;
    setPending(text);
    setThinkingStep(0);
    setDraft("");
    setError(null);
    try {
      const threadId = thread?.id ?? (await newThread());
      if (!threadId) return;
      const response = await fetch(`/api/hr/${encodeURIComponent(shareId)}/threads/${threadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      });
      const body = await response.json().catch(() => null);
      if (response.status === 401) {
        router.push(base);
        return;
      }
      if (response.status === 429) setUsed(limit);
      if (!response.ok || !body?.id) {
        if (response.status !== 429) setDraft(text);
        setError(typeof body?.detail === "string" ? body.detail : "The chat did not answer. Please try again.");
        return;
      }
      if (!thread) {
        router.replace(`${base}/chat/${threadId}`); // the new chat's own page loads it
        return;
      }
      setMessages((current) => [...current, body as HrMessage]);
      setUsed((value) => value + 1);
      router.refresh(); // the list of chats gets the new title
    } catch {
      setDraft(text);
      setError("Network error. Check your internet and try again.");
    } finally {
      setPending(null);
    }
  }

  async function book(slot: Slot, name: string, email: string) {
    if (!thread) return;
    setBooking(true);
    setError(null);
    try {
      const response = await fetch(`/api/hr/${encodeURIComponent(shareId)}/threads/${thread.id}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startsAt: slot.startsAt, name, email }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.id) {
        const detail = typeof body?.detail === "string" ? body.detail : body?.detail?.[0]?.msg;
        setError(detail ?? "Could not book this time. Please try again.");
        return;
      }
      setMessages((current) => [...current, body as HrMessage]);
    } catch {
      setError("Network error. Check your internet and try again.");
    } finally {
      setBooking(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(draft);
  }

  const suggestions = [
    `What is ${me.firstName}'s experience?`,
    `Which skills does ${me.firstName} have?`,
    "Can we book a 30-minute call?",
  ].filter((question) => !messages.some((message) => message.question === question));

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
    <div className="flex min-h-screen flex-wrap items-stretch">
      <nav aria-label="Chat threads" className="flex min-w-0 flex-[1_1_264px] flex-col gap-5 border-r border-line bg-white px-4 py-5">
        <div className="flex items-center gap-2.5 text-[15px] font-semibold">
          <span aria-hidden="true" className="flex size-7 items-center justify-center rounded-lg bg-accent text-xs text-white">
            RA
          </span>
          Resume Assistant
        </div>
        <div className="rounded-lg bg-ground p-3">
          <div className="text-[15px] font-semibold">{me.candidateName}</div>
          {me.headline ? <div className="mt-1 text-[13px] text-muted">{me.headline}</div> : null}
        </div>
        <button
          type="button"
          onClick={startNewChat}
          className="min-h-11 rounded-lg border border-ink bg-white px-3.5 text-sm font-medium hover:bg-ground"
        >
          New chat
        </button>
        <div className="flex flex-col gap-1">
          <div className="px-2 pb-1.5 text-[13px] text-muted">Your chats</div>
          {me.threads.length === 0 ? <p className="px-2 text-sm text-muted">No chats yet.</p> : null}
          {me.threads.map((item) => {
            const current = item.id === thread?.id;
            return (
              <Link
                key={item.id}
                href={`${base}/chat/${item.id}`}
                aria-current={current ? "page" : undefined}
                className={`flex min-h-11 items-center rounded-lg px-2.5 py-2 text-sm no-underline break-words ${current ? "bg-accent-soft font-medium text-accent-strong" : "text-ink hover:bg-ground hover:text-ink"}`}
              >
                {item.title}
              </Link>
            );
          })}
        </div>
        <div className={`mt-auto flex flex-col gap-2 rounded-lg p-3 ${atLimit ? "bg-warn-soft" : "bg-ground"}`}>
          <div className={`flex justify-between gap-2 text-[13px] ${atLimit ? "text-warn" : ""}`}>
            <span>Questions today</span>
            <span className="font-semibold">
              {used} of {limit}
            </span>
          </div>
          <div role="img" aria-label={`${used} of ${limit} questions used`} className="h-1.5 rounded-full bg-line">
            <div
              className={`h-1.5 rounded-full ${atLimit ? "bg-[#b85c00]" : "bg-accent"}`}
              style={{ width: `${Math.min(100, (used / limit) * 100)}%` }}
            />
          </div>
        </div>
        <form action={leaveHrChat.bind(null, shareId)} className="flex flex-col items-start gap-0.5 text-[13px] text-muted">
          <span>
            Signed in as <span className="font-mono whitespace-nowrap text-ink">{me.phone}</span>
          </span>
          <button type="submit" className="min-h-9 underline hover:text-ink">
            Use another number
          </button>
        </form>
      </nav>

      <main className="flex min-w-0 flex-[999_1_560px] flex-col">
        <header className="flex min-h-[72px] items-center border-b border-line bg-white px-4 py-3.5 md:px-8">
          <h1 className="text-lg font-semibold break-words">{thread?.title ?? "New chat"}</h1>
        </header>
        <div className="mx-auto flex w-full max-w-[820px] flex-1 flex-col gap-7 px-4 py-7 md:px-8">
          {messages.length === 0 && pending === null ? (
            <p className="rounded-lg bg-white p-5 text-[15px] leading-relaxed text-muted">
              Ask anything about {me.firstName}&apos;s work: experience, skills, projects or education. You can also
              book a call.
            </p>
          ) : null}

          {messages.map((message) => (
            <article key={message.id} className="flex flex-col gap-3">
              <p className="max-w-[80%] self-end rounded-[14px_14px_4px_14px] bg-ink px-4 py-3 text-[15px] leading-normal break-words text-white">
                {message.question}
              </p>
              {message.outcome === "blocked" ? (
                <p className="max-w-[88%] rounded-xl border border-warn-line bg-warn-soft px-4 py-3.5 text-[15px] text-warn">
                  {message.answer}
                </p>
              ) : message.outcome === "booked" && message.interview ? (
                <div className="flex max-w-[88%] flex-col gap-3">
                  <p className="text-base leading-relaxed">{message.answer}</p>
                  <BookedCard interview={message.interview} firstName={me.firstName} />
                </div>
              ) : (
                <p className="max-w-[88%] text-base leading-relaxed whitespace-pre-line">{message.answer}</p>
              )}
              {message.outcome === "slots" && message.slots.length > 0 && message.id === lastSlotsId && !upcoming ? (
                <SlotPicker slots={message.slots} onBook={book} busy={booking} />
              ) : null}
              {message.outcome === "answered" && message.sources.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
                  <span>From the resume:</span>
                  {sections(message).map((section) => (
                    <span key={section} className="rounded-full border border-line px-2.5 py-0.5 text-ink">
                      {section}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          ))}

          {pending !== null ? (
            <article className="flex flex-col gap-3" aria-live="polite">
              <p className="max-w-[80%] self-end rounded-[14px_14px_4px_14px] bg-ink px-4 py-3 text-[15px] break-words text-white">
                {pending}
              </p>
              <p className="flex items-center gap-2 text-[15px] text-accent-strong">
                <Spinner className="size-4" />
                <span className="text-shimmer">{THINKING[thinkingStep]}…</span>
              </p>
            </article>
          ) : null}
          <div ref={endRef} />

          <div className="mt-auto flex flex-col gap-3">
            {error ? (
              <p role="alert" className="rounded-lg border border-warn-line bg-warn-soft px-4 py-3 text-sm text-warn">
                {error}
              </p>
            ) : null}
            {atLimit ? (
              <div role="status" className="rounded-xl border border-warn-line bg-warn-soft p-5">
                <h2 className="text-lg font-semibold text-warn">You have used all {limit} questions for today</h2>
                <p className="mt-1 text-[15px]">You can ask more tomorrow. Your chats stay saved, and you can still read them.</p>
              </div>
            ) : (
              <>
                {suggestions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((question) => (
                      <button
                        key={question}
                        type="button"
                        onClick={() => ask(question)}
                        disabled={pending !== null}
                        className="min-h-11 rounded-full border border-line-strong bg-white px-3.5 text-sm hover:bg-ground disabled:opacity-50"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                ) : null}
                <form onSubmit={onSubmit} className="flex gap-2">
                  <label htmlFor="hr-question" className="sr-only">
                    Ask a question
                  </label>
                  <input
                    id="hr-question"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    maxLength={500}
                    placeholder={`Ask about ${me.firstName}'s resume`}
                    className="min-h-12 min-w-0 flex-1 rounded-lg border border-line-strong bg-white px-3.5 text-[15px]"
                  />
                  <button
                    type="submit"
                    disabled={pending !== null || draft.trim().length === 0}
                    className="min-h-12 rounded-lg bg-accent px-5 text-[15px] font-medium text-white hover:bg-accent-strong disabled:opacity-50"
                  >
                    Send
                  </button>
                </form>
                <span className="text-[13px] text-muted">
                  {limit - used} {limit - used === 1 ? "question" : "questions"} left today
                </span>
              </>
            )}
          </div>
        </div>
      </main>

      <aside aria-label="How the agent answered" className="flex min-w-0 flex-[1_1_320px] flex-col gap-6 border-l border-line bg-white p-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold">How the agent answered</h2>
          <span className="text-[13px] break-words text-muted">
            {pending !== null ? `For: ${pending}` : last ? `For: ${last.question}` : "Ask a question to see the steps."}
          </span>
        </div>
        {asideSteps.length > 0 ? <Steps steps={asideSteps} /> : null}
        {upcoming ? <BookedCard interview={upcoming} firstName={me.firstName} /> : null}
      </aside>
    </div>
  );
}
