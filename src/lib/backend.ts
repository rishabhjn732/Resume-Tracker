import type { Candidate, HrMe, HrOverview, HrThread, PublicShare, ResumeDetail, ResumeList, TestChat, User } from "./types";

// LEARN (server-only code): Only Server Components, Server Actions and Route Handlers
// use this file. BACKEND_URL has no NEXT_PUBLIC_ prefix, so the browser never sees it.
//
// The browser never calls FastAPI directly. It calls Next.js, and Next.js calls FastAPI.
// So the login token can stay in an httpOnly cookie that browser JavaScript can't read.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export class BackendError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// Exported for Route Handlers that pass a browser request on to the backend.
export async function callBackend(path: string, init: RequestInit = {}): Promise<Response> {
  try {
    // cache: "no-store" means: always ask the backend, never reuse an old answer.
    return await fetch(`${BACKEND_URL}${path}`, { ...init, cache: "no-store" });
  } catch {
    throw new BackendError(`Cannot reach the backend at ${BACKEND_URL}. Is it running?`, 503);
  }
}

// POST /api/auth/google: gives Google's token to the backend and gets OUR token back.
export async function loginWithGoogleToken(
  credential: string,
): Promise<{ accessToken: string; user: User }> {
  const response = await callBackend("/api/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new BackendError(body?.detail ?? "Login failed.", response.status);
  }
  return response.json();
}

// GET /api/me: returns the user, or null if the token is missing, wrong or expired.
export async function getMe(token: string): Promise<User | null> {
  const response = await callBackend("/api/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new BackendError("Could not load your account.", response.status);
  return response.json();
}

// GET /api/candidates/{userId}: returns the candidate, or null if there is no such candidate.
export async function getCandidate(userId: string): Promise<Candidate | null> {
  const response = await callBackend(`/api/candidates/${encodeURIComponent(userId)}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new BackendError("Could not load the candidate.", response.status);

  const data: { userId: string; name: string; title: string } = await response.json();
  return { ...data, firstName: data.name.split(" ")[0] };
}

// ----- Resumes -----

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

// GET /api/resumes: your resumes, newest first.
export async function getResumes(token: string): Promise<ResumeList> {
  const response = await callBackend("/api/resumes", { headers: authHeader(token) });
  if (response.status === 503) {
    // S3, OpenAI or pgvector is not set up yet. Show the reason instead of an error page.
    const body = await response.json().catch(() => null);
    return { items: [], limit: 40, unavailableReason: body?.detail ?? "Resume upload is off." };
  }
  if (!response.ok) throw new BackendError("Could not load your resumes.", response.status);
  return response.json();
}

// GET /api/resumes/{id}: one resume with its steps, summary and chunks.
export async function getResume(token: string, id: number): Promise<ResumeDetail | null> {
  const response = await callBackend(`/api/resumes/${id}`, { headers: authHeader(token) });
  if (response.status === 404) return null;
  if (!response.ok) throw new BackendError("Could not load the resume.", response.status);
  return response.json();
}

// The test chat and HR APIs come in the next backend step. Until then the backend
// answers 404 (no such URL), 405 or 501. We return null, and the page says
// "not switched on yet" instead of showing an error page.
const NOT_BUILT_YET = [404, 405, 501, 503];

// GET /api/resumes/{id}/test-chat: the test questions asked so far, and the limit (8).
export async function getTestChat(token: string, id: number): Promise<TestChat | null> {
  const response = await callBackend(`/api/resumes/${id}/test-chat`, { headers: authHeader(token) });
  if (NOT_BUILT_YET.includes(response.status)) return null;
  if (!response.ok) throw new BackendError("Could not load the test chat.", response.status);
  return response.json();
}

// GET /api/resumes/{id}/hr: the share link, interviews and HR activity.
export async function getHrOverview(token: string, id: number): Promise<HrOverview | null> {
  const response = await callBackend(`/api/resumes/${id}/hr`, { headers: authHeader(token) });
  if (NOT_BUILT_YET.includes(response.status)) return null;
  if (!response.ok) throw new BackendError("Could not load HR activity.", response.status);
  return response.json();
}

// ----- The HR side. These use an HR token (from the phone number), not a candidate login. -----

// GET /api/public/shares/{shareId}: the candidate's name, and whether the chat is open. No login needed.
export async function getPublicShare(shareId: string): Promise<PublicShare | null> {
  const response = await callBackend(`/api/public/shares/${encodeURIComponent(shareId)}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new BackendError("Could not open this link.", response.status);
  return response.json();
}

// Returns null when the HR token is missing, wrong or expired (then HR enters the phone again).
export async function getHrMe(shareId: string, hrToken: string): Promise<HrMe | null> {
  const response = await callBackend(`/api/public/shares/${encodeURIComponent(shareId)}/me`, {
    headers: authHeader(hrToken),
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new BackendError("Could not load your chats.", response.status);
  return response.json();
}

export async function getHrThread(shareId: string, hrToken: string, threadId: number): Promise<HrThread | null> {
  const response = await callBackend(`/api/public/shares/${encodeURIComponent(shareId)}/threads/${threadId}`, {
    headers: authHeader(hrToken),
  });
  if (response.status === 401 || response.status === 404) return null;
  if (!response.ok) throw new BackendError("Could not load the chat.", response.status);
  return response.json();
}
