import { relayToBackend } from "@/lib/relay";

// POST: ask the backend for Google's "Allow" page. The browser then goes there.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const returnTo = typeof body?.returnTo === "string" ? body.returnTo : "/dashboard";
  return relayToBackend("/api/calendar/google/connect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ returnTo }),
  });
}
