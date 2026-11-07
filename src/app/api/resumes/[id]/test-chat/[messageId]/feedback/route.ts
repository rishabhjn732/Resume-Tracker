import { NextResponse } from "next/server";
import { relayToBackend } from "@/lib/relay";

type Context = { params: Promise<{ id: string; messageId: string }> };

// PUT: the candidate marks a test answer "right" or "wrong" (or null to clear it).
export async function PUT(request: Request, { params }: Context) {
  const { id, messageId } = await params;
  if (!/^\d+$/.test(id) || !/^\d+$/.test(messageId)) {
    return NextResponse.json({ detail: "Not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const verdict = body?.verdict;
  if (verdict !== "right" && verdict !== "wrong" && verdict !== null) {
    return NextResponse.json({ detail: "Verdict must be right, wrong or null." }, { status: 400 });
  }

  return relayToBackend(`/api/resumes/${id}/test-chat/${messageId}/feedback`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ verdict }),
  });
}
