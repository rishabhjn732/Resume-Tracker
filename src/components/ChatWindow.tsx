"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AgentSteps } from "@/components/AgentSteps";
import { AnswerCard } from "@/components/AnswerCard";
import { DAILY_QUESTION_LIMIT, limitSteps } from "@/lib/limits";
import type { AgentStep, ChatMessage, ChatRequest, ChatResponse } from "@/lib/types";

const starterQuestions = [
  "Does he have search experience?",
  "Compare with my job description",
  "Book a 30-minute call",
];

type Props = {
  userId: string;
  threadId: string;
  firstName: string;
  title: string;
  initialMessages: ChatMessage[];
  initialUsed: number;
  initialMemory: string[];
};

// LEARN (Client Component): Typing, clicking and live updates need the browser.
export function ChatWindow({
  userId,
  threadId,
  firstName,
  title,
  initialMessages,
  initialUsed,
  initialMemory,
}: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [used, setUsed] = useState(initialUsed);
  const [memory, setMemory] = useState(initialMemory);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSteps, setShowSteps] = useState(true);
  const [blockedSteps, setBlockedSteps] = useState<AgentStep[] | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pendingCount = useRef(0);

  const limitReached = used >= DAILY_QUESTION_LIMIT;
  const questionsLeft = Math.max(DAILY_QUESTION_LIMIT - used, 0);
  const isBooked = messages.some((message) => message.card?.type === "booked");
  const lastAnswer = [...messages].reverse().find((message) => message.role === "assistant");
  const stepsToShow = blockedSteps ?? (limitReached ? limitSteps : (lastAnswer?.steps ?? []));

  useEffect(() => {
    if (messages.length > initialMessages.length || isSending) {
      bottomRef.current?.scrollIntoView({ block: "end" });
    }
  }, [messages, isSending, initialMessages.length]);

  // LEARN (browser to API): The browser calls /api/chat, then updates React state.
  async function send(kind: ChatRequest["kind"], text: string, visibleText: string) {
    if (!text.trim() || isSending) return;

    setError(null);
    setIsSending(true);
    pendingCount.current += 1;
    const pendingId = `pending-${pendingCount.current}`;
    setMessages((current) => [...current, { id: pendingId, role: "user", text: visibleText }]);

    try {
      const body: ChatRequest = { userId, threadId, kind, text };
      const result = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: ChatResponse | { error: string } = await result.json();

      if ("error" in data) throw new Error(data.error);

      if (data.limitReached) {
        setMessages((current) => current.filter((message) => message.id !== pendingId));
        setUsed(data.used);
        setBlockedSteps(data.steps);
      } else {
        setMessages((current) => [...current, data.message]);
        setUsed(data.used);
        setMemory(data.memory);
        setBlockedSteps(null);
      }

      // LEARN (router.refresh): Reload Server Components to update the sidebar.
      router.refresh();
    } catch (caught) {
      setMessages((current) => current.filter((message) => message.id !== pendingId));
      setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  function ask(question: string) {
    void send("question", question, question);
  }

  function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = input;
    setInput("");
    ask(question);
  }

  const actions = {
    onAsk: ask,
    onBook: (slot: string) => void send("book", slot, `Book ${slot}`),
    onCompare: (jobDescription: string) => void send("jd", jobDescription, "Job description added"),
    disabled: isSending,
    isBooked,
  };

  return (
    <>
      <main className="flex min-w-0 flex-[999_1_560px] flex-col">
        <header className="flex min-h-[72px] flex-wrap items-center justify-between gap-3 border-b border-line bg-white px-4 py-3 md:px-8">
          <h1 className="min-w-0 text-lg font-semibold break-words">{title}</h1>
          <button
            type="button"
            onClick={() => setShowSteps((current) => !current)}
            className="min-h-11 rounded-lg border border-line-strong bg-white px-3 text-sm font-medium hover:bg-ground"
          >
            {showSteps ? "Hide agent steps" : "Show agent steps"}
          </button>
        </header>

        <div className="mx-auto flex w-full max-w-[820px] flex-1 flex-col gap-6 px-4 py-7 md:px-8">
          {messages.length === 0 && !limitReached ? (
            <div className="flex flex-col gap-3">
              <p className="text-base leading-relaxed">Ask anything about {firstName}&apos;s resume.</p>
              <div className="flex flex-wrap gap-2">
                {starterQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    disabled={isSending}
                    onClick={() => ask(question)}
                    className="min-h-11 rounded-full border border-line-strong bg-white px-4 text-sm hover:bg-ground disabled:opacity-60"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((message) =>
            message.role === "user" ? (
              <div
                key={message.id}
                className="max-w-[80%] self-end rounded-xl bg-ink px-4 py-3 text-[15px] leading-normal break-words text-white"
              >
                {message.text}
              </div>
            ) : (
              <div key={message.id} className="flex flex-col gap-4">
                <p className="leading-relaxed">{message.text}</p>
                {message.card ? <AnswerCard card={message.card} actions={actions} /> : null}
                {message.sources ? (
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
                    <span>Sources:</span>
                    {message.sources.map((source) => (
                      <span key={source} className="rounded-full border border-line px-2.5 py-1 text-ink">
                        {source}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ),
          )}

          {isSending ? (
            <p role="status" className="text-sm text-muted">
              Agent is working…
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="rounded-lg bg-warn-soft p-3 text-sm font-medium text-warn">
              {error}
            </p>
          ) : null}
          <div className="sticky bottom-0 mt-auto flex flex-col gap-3 bg-ground pt-3 pb-1">
            {limitReached ? (
              <div className="flex flex-col gap-2 rounded-xl border border-warn-line bg-warn-soft p-5">
                <h2 className="text-lg font-semibold text-warn">
                  You have used all {DAILY_QUESTION_LIMIT} questions for today
                </h2>
                <p className="text-[15px]">You can ask more questions tomorrow. Your chats stay saved, and you can still read them.</p>
              </div>
            ) : (
              <>
                <form onSubmit={submitQuestion} className="flex gap-2">
                  <input
                    aria-label="Ask a question"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    maxLength={1000}
                    placeholder={`Ask about ${firstName}'s resume`}
                    className="min-h-12 min-w-0 flex-1 rounded-lg border border-line-strong bg-white px-3.5"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !input.trim()}
                    className="min-h-12 rounded-lg bg-accent px-5 font-medium text-white hover:bg-accent-strong disabled:opacity-60"
                  >
                    Send
                  </button>
                </form>
                <p className="text-sm text-muted">
                  {questionsLeft} {questionsLeft === 1 ? "question" : "questions"} left today
                </p>
              </>
            )}
          </div>
          <div ref={bottomRef} />
        </div>
      </main>

      {showSteps ? <AgentSteps steps={stepsToShow} memory={memory} /> : null}
    </>
  );
}
