import { NextResponse } from "next/server";
import { relayAsHr } from "@/lib/hr-relay";

type Context = { params: Promise<{ shareId: string; threadId: string }> };

// POST: book the time HR picked and confirmed.
export async function POST(request: Request, { params }: Context) {
  const { shareId, threadId } = await params;
  if (!/^\d+$/.test(threadId)) return NextResponse.json({ detail: "Chat not found." }, { status: 404 });
  const body = await request.json().catch(() => null);
  const { startsAt, name, email } = body ?? {};
  if (typeof startsAt !== "string" || typeof name !== "string" || typeof email !== "string") {
    return NextResponse.json({ detail: "Please choose a time and give your name and email." }, { status: 400 });
  }
  return relayAsHr(shareId, `/threads/${threadId}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ startsAt, name: name.trim(), email: email.trim() }),
  });
}
