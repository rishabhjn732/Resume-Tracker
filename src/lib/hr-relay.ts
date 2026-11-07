import { NextResponse } from "next/server";
import { BackendError, callBackend } from "./backend";
import { getHrToken } from "./hr-auth";

// Like relay.ts, but for HR: it adds the HR token of THIS share link from its cookie.
export async function relayAsHr(shareId: string, path: string, init: RequestInit = {}) {
  const token = await getHrToken(shareId);
  if (!token) {
    return NextResponse.json({ detail: "Please enter your phone number again." }, { status: 401 });
  }
  let response: Response;
  try {
    response = await callBackend(`/api/public/shares/${encodeURIComponent(shareId)}${path}`, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    const status = error instanceof BackendError ? error.status : 503;
    return NextResponse.json({ detail: "The server is not reachable. Please try again." }, { status });
  }
  return new NextResponse(await response.text(), {
    status: response.status,
    headers: { "Content-Type": response.headers.get("Content-Type") ?? "application/json" },
  });
}

export async function readQuestion(request: Request) {
  const body = await request.json().catch(() => null);
  const question = typeof body?.question === "string" ? body.question.trim() : "";
  if (!question || question.length > 500) return null;
  return question;
}
