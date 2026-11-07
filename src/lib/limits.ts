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

// Vercel can't pass bigger files through Next.js, and the backend allows 4 MB too.
export const MAX_RESUME_BYTES = 4 * 1024 * 1024;
export const RESUME_FILE_TYPES = [".pdf", ".docx"];

// How many test questions a candidate can ask about each resume.
export const TEST_QUESTION_LIMIT = 8;
