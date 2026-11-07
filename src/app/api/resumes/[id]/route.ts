import { NextResponse } from "next/server";
import { relayToBackend } from "@/lib/relay";

type Context = { params: Promise<{ id: string }> };

function toId(value: string) {
  return /^\d+$/.test(value) ? value : null;
}

// The page asks this every second while a resume is processing.
export async function GET(_request: Request, { params }: Context) {
  const id = toId((await params).id);
  if (!id) return NextResponse.json({ detail: "Resume not found." }, { status: 404 });
  return relayToBackend(`/api/resumes/${id}`);
}

export async function DELETE(_request: Request, { params }: Context) {
  const id = toId((await params).id);
  if (!id) return NextResponse.json({ detail: "Resume not found." }, { status: 404 });
  return relayToBackend(`/api/resumes/${id}`, { method: "DELETE" });
}
