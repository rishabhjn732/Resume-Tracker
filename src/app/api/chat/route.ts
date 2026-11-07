import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { DAILY_QUESTION_LIMIT, limitSteps } from "@/lib/limits";
import { runMockAgent } from "@/lib/mock-agent";
import { getCandidate } from "@/lib/backend";
import { HR_COOKIE } from "@/lib/session";
import {
  addMessages,
  countQuestion,
  getMemory,
  getQuestionsUsed,
  getThread,
  newMessageId,
  saveMemory,
  wasAskedBefore,
} from "@/lib/store";
import type { ChatMessage, ChatRequest, ChatResponse } from "@/lib/types";

const MAX_LENGTH = { question: 1000, book: 100, jd: 10000 };

// LEARN (Route Handler): This file creates the API URL POST /api/chat.
// The folder path makes the URL, and the function name is the HTTP method.
// The candidate comes from the backend, but the answer still comes from the fake agent.
// Later, this route will send the question to FastAPI and LangGraph.
export async function POST(request: Request) {
  let body: ChatRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const { userId, threadId, kind, text } = body;
  if (
    typeof userId !== "string" ||
    typeof threadId !== "string" ||
    typeof text !== "string" ||
    !(kind === "question" || kind === "book" || kind === "jd")
  ) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const cleanText = text.trim();
  if (!cleanText || cleanText.length > MAX_LENGTH[kind]) {
    return NextResponse.json({ error: "The message is empty or too long." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const phone = cookieStore.get(HR_COOKIE)?.value;
  if (!phone) {
    return NextResponse.json({ error: "Please enter your phone number first." }, { status: 401 });
  }

  const candidate = await getCandidate(userId);
  const thread = candidate ? getThread(userId, phone, threadId) : null;
  if (!candidate || !thread) {
    return NextResponse.json({ error: "Chat not found." }, { status: 404 });
  }

  // Check the limit BEFORE running the agent, so a blocked request costs no API money.
  // Booking is not a new question, because HR is confirming an earlier answer.
  const used = getQuestionsUsed(userId, phone);
  if (kind !== "book" && used >= DAILY_QUESTION_LIMIT) {
    const response: ChatResponse = { limitReached: true, used, steps: limitSteps };
    return NextResponse.json(response, { status: 429 });
  }

  const reply = runMockAgent({
    candidate,
    kind,
    text: cleanText,
    askedBefore: kind === "question" ? wasAskedBefore(userId, cleanText) : false,
  });

  const newUsed = reply.countsAsQuestion ? countQuestion(userId, phone) : used;
  if (reply.memoryFact) saveMemory(userId, phone, reply.memoryFact);

  const visibleText =
    kind === "book" ? `Book ${cleanText}` : kind === "jd" ? "Job description added" : cleanText;
  const userMessage: ChatMessage = { id: newMessageId(), role: "user", text: visibleText };
  const assistantMessage: ChatMessage = {
    id: newMessageId(),
    role: "assistant",
    text: reply.text,
    card: reply.card,
    sources: reply.sources,
    steps: reply.steps,
  };
  addMessages(thread, [userMessage, assistantMessage], visibleText);

  const response: ChatResponse = {
    limitReached: false,
    message: assistantMessage,
    used: newUsed,
    memory: getMemory(userId, phone),
  };
  return NextResponse.json(response);
}
