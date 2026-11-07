import { relayToBackend } from "@/lib/relay";

// DELETE: disconnect Google Calendar.
export async function DELETE() {
  return relayToBackend("/api/calendar/google", { method: "DELETE" });
}
