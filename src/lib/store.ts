import { randomUUID } from "node:crypto";
import type { ChatMessage, Thread } from "./types";

// FAKE DATABASE: all data lives in server memory and is lost on restart.
// Phase 3 replaces this with Postgres. It will not work properly on Vercel,
// because Vercel can run many separate copies of the server.

type Store = {
  threads: Map<string, Thread[]>;
  usage: Map<string, number>;
  memory: Map<string, string[]>;
  askedQuestions: Map<string, Set<string>>;
};

// globalThis keeps one shared copy while the dev server reloads your code.
const globalStore = globalThis as typeof globalThis & { resumeStore?: Store };

const store: Store = (globalStore.resumeStore ??= {
  threads: new Map(),
  usage: new Map(),
  memory: new Map(),
  askedQuestions: new Map(),
});

function ownerKey(userId: string, phone: string) {
  return `${userId}:${phone}`;
}

function todayInIndia() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

export function listThreads(userId: string, phone: string) {
  return store.threads.get(ownerKey(userId, phone)) ?? [];
}

export function getThread(userId: string, phone: string, threadId: string) {
  return listThreads(userId, phone).find((thread) => thread.id === threadId) ?? null;
}

// If an empty chat already exists, use it again instead of making another one.
export function getOrCreateEmptyThread(userId: string, phone: string) {
  const threads = listThreads(userId, phone);
  const empty = threads.find((thread) => thread.messages.length === 0);
  if (empty) return empty;

  const thread: Thread = {
    id: randomUUID().slice(0, 8),
    ownerKey: ownerKey(userId, phone),
    title: "New chat",
    messages: [],
  };
  store.threads.set(thread.ownerKey, [thread, ...threads]);
  return thread;
}

export function addMessages(thread: Thread, messages: ChatMessage[], titleFrom: string) {
  if (thread.messages.length === 0) {
    thread.title = titleFrom.length > 34 ? `${titleFrom.slice(0, 34)}…` : titleFrom;
  }
  thread.messages.push(...messages);
}

export function newMessageId() {
  return randomUUID().slice(0, 8);
}

// The limit is for each HR, for each resume link, for each day.
function usageKey(userId: string, phone: string) {
  return `${ownerKey(userId, phone)}:${todayInIndia()}`;
}

export function getQuestionsUsed(userId: string, phone: string) {
  return store.usage.get(usageKey(userId, phone)) ?? 0;
}

export function countQuestion(userId: string, phone: string) {
  const used = getQuestionsUsed(userId, phone) + 1;
  store.usage.set(usageKey(userId, phone), used);
  return used;
}

export function getMemory(userId: string, phone: string) {
  return store.memory.get(ownerKey(userId, phone)) ?? [];
}

export function saveMemory(userId: string, phone: string, fact: string) {
  const memory = getMemory(userId, phone);
  if (!memory.includes(fact)) {
    store.memory.set(ownerKey(userId, phone), [...memory, fact]);
  }
}

// Fake semantic cache: it only matches the same text.
// The real cache will compare embeddings, so similar questions can match too.
export function wasAskedBefore(userId: string, question: string) {
  const asked = store.askedQuestions.get(userId) ?? new Set<string>();
  const normalized = question.trim().toLowerCase();
  const found = asked.has(normalized);
  asked.add(normalized);
  store.askedQuestions.set(userId, asked);
  return found;
}
