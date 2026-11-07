import { NextResponse } from "next/server";
import { MAX_RESUME_BYTES } from "@/lib/limits";
import { relayToBackend } from "@/lib/relay";

// LEARN (Route Handler): this file makes the URLs GET and POST /api/resumes on Next.js.
// They pass the request on to FastAPI, with the login token from the cookie.

// Upload a resume file.
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ detail: "Please choose a file." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ detail: "Please choose a file." }, { status: 400 });
  }
  if (file.size > MAX_RESUME_BYTES) {
    return NextResponse.json({ detail: "The file is bigger than 4 MB." }, { status: 413 });
  }

  const body = new FormData();
  body.append("file", file, file.name);
  return relayToBackend("/api/resumes", { method: "POST", body });
}

// List your resumes.
export async function GET() {
  return relayToBackend("/api/resumes");
}
