import { NextResponse } from "next/server";
import { relayToBackend } from "@/lib/relay";

type Context = { params: Promise<{ id: string }> };

const MAX_QUESTION_CHARS = 500;

// GET: the test questions asked so far.
export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ detail: "Resume not found." }, { status: 404 });
  return relayToBackend(`/api/resumes/${id}/test-chat`);
}

// POST: ask one test question. The backend counts it toward the limit of 8.
export async function POST(request: Request, { params }: Context) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ detail: "Resume not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const question = typeof body?.question === "string" ? body.question.trim() : "";
  if (!question) return NextResponse.json({ detail: "Please type a question." }, { status: 400 });
  if (question.length > MAX_QUESTION_CHARS) {
    return NextResponse.json({ detail: "Please keep the question under 500 characters." }, { status: 400 });
  }

  return relayToBackend(`/api/resumes/${id}/test-chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
}
