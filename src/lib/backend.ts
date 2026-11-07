import type { Candidate, User } from "./types";

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

async function callBackend(path: string, init: RequestInit = {}): Promise<Response> {
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
