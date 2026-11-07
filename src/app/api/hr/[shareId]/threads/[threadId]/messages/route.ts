import { NextResponse } from "next/server";
import { readQuestion, relayAsHr } from "@/lib/hr-relay";

type Context = { params: Promise<{ shareId: string; threadId: string }> };

// POST: ask a question. 429 when this HR person's questions for today are used.
export async function POST(request: Request, { params }: Context) {
  const { shareId, threadId } = await params;
  if (!/^\d+$/.test(threadId)) return NextResponse.json({ detail: "Chat not found." }, { status: 404 });
  const question = await readQuestion(request);
  if (!question) return NextResponse.json({ detail: "Please type a question (up to 500 characters)." }, { status: 400 });
  return relayAsHr(shareId, `/threads/${threadId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
}
