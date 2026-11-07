import { relayToBackend } from "@/lib/relay";

// PUT: save your working hours. The backend checks every value.
export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ detail: "Please send your working hours." }, { status: 400 });
  }
  return relayToBackend("/api/me/availability", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
