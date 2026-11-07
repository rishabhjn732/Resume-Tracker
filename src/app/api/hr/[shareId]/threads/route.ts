import { relayAsHr } from "@/lib/hr-relay";

type Context = { params: Promise<{ shareId: string }> };

// POST: start a new chat thread.
export async function POST(_request: Request, { params }: Context) {
  const { shareId } = await params;
  return relayAsHr(shareId, "/threads", { method: "POST" });
}
