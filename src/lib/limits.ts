import type { AgentStep } from "./types";

// This small file is safe to use on both the server and in the browser.
export const DAILY_QUESTION_LIMIT = 20;

export const limitSteps: AgentStep[] = [
  {
    name: "Daily limit check",
    tag: "Blocked",
    tone: "warn",
    detail: `This phone number has used ${DAILY_QUESTION_LIMIT} of ${DAILY_QUESTION_LIMIT} for this resume link.`,
  },
  {
    name: "Agent",
    tag: "Not run",
    tone: "muted",
    detail: "No model call, so no API cost.",
  },
];
