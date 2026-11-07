// Shared TypeScript types. A type describes the shape of our data.

export type Tone = "ok" | "warn" | "muted";

export type AgentStep = {
  name: string;
  tag: string;
  tone: Tone;
  detail: string;
};

export type JdRow = {
  requirement: string;
  result: "Match" | "Partial" | "Not found";
  proof: string;
};

// The agent returns data, and React decides how to draw it.
// The "type" field tells the frontend which card to show.
export type Card =
  | { type: "timeline"; items: { years: string; company: string; role: string }[] }
  | { type: "slots"; slots: { id: string; day: string; time: string }[] }
  | { type: "booked"; slot: string }
  | { type: "jdInput" }
  | { type: "jdResult"; rows: JdRow[] }
  | { type: "blocked"; suggestions: string[] }
  | { type: "suggestions"; suggestions: string[] };

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  card?: Card;
  sources?: string[];
  steps?: AgentStep[];
};

export type Thread = {
  id: string;
  ownerKey: string;
  title: string;
  messages: ChatMessage[];
};

export type ChatRequest = {
  userId: string;
  threadId: string;
  kind: "question" | "book" | "jd";
  text: string;
};

export type ChatResponse =
  | { limitReached: false; message: ChatMessage; used: number; memory: string[] }
  | { limitReached: true; used: number; steps: AgentStep[] };
