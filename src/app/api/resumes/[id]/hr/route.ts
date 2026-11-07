import { NextResponse } from "next/server";
import { relayToBackend } from "@/lib/relay";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ detail: "Resume not found." }, { status: 404 });
  return relayToBackend(`/api/resumes/${id}/hr`);
}

// PATCH: turn the HR link on or off.
export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ detail: "Resume not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (typeof body?.linkEnabled !== "boolean") {
    return NextResponse.json({ detail: "linkEnabled must be true or false." }, { status: 400 });
  }

  return relayToBackend(`/api/resumes/${id}/hr`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ linkEnabled: body.linkEnabled }),
  });
}
