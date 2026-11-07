import type { AgentStep, Candidate, Card, JdRow } from "./types";

// FAKE AGENT: no LLM and no vector search. It only checks for words.
// This lets you build and learn the frontend before the real backend exists.
// Later, the API route will call FastAPI and LangGraph instead of this file.

export type AgentInput = {
  candidate: Candidate;
  kind: "question" | "book" | "jd";
  text: string;
  askedBefore: boolean;
};

export type AgentOutput = {
  text: string;
  card?: Card;
  sources?: string[];
  steps: AgentStep[];
  countsAsQuestion: boolean;
  memoryFact?: string;
};

const guardrailPassed: AgentStep = {
  name: "Guardrail",
  tag: "Passed",
  tone: "ok",
  detail: "The question is about the resume.",
};

const memoryLoaded: AgentStep = {
  name: "Memory",
  tag: "Loaded",
  tone: "ok",
  detail: "Loaded the summary of this HR's earlier chats.",
};

const suggestions = ["Does he have search experience?", "Book a 30-minute call"];

function resumeAnswerSteps(askedBefore: boolean, lastStep?: AgentStep): AgentStep[] {
  if (askedBefore) {
    return [
      guardrailPassed,
      memoryLoaded,
      { name: "Semantic cache", tag: "Hit", tone: "ok", detail: "Same question found. Use the saved answer." },
      { name: "Retriever", tag: "Skipped", tone: "muted", detail: "No search was needed." },
      { name: "Generator", tag: "Skipped", tone: "muted", detail: "No model call, so no API cost." },
    ];
  }
  const steps: AgentStep[] = [
    guardrailPassed,
    memoryLoaded,
    { name: "Semantic cache", tag: "Miss", tone: "warn", detail: "No similar question found. Run the full flow." },
    { name: "Retriever", tag: "3 chunks", tone: "ok", detail: "Found matching parts of the resume and work history." },
    { name: "Generator", tag: "Done", tone: "ok", detail: "Wrote the answer only from those chunks." },
  ];
  return lastStep ? [...steps, lastStep] : steps;
}

// Show the next 3 working days, so the demo never shows old dates.
function nextWorkingDays(count: number) {
  const days: string[] = [];
  const date = new Date();
  const format = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  });
  while (days.length < count) {
    date.setDate(date.getDate() + 1);
    const label = format.format(date);
    if (!label.startsWith("Sat") && !label.startsWith("Sun")) days.push(label.replace(",", ""));
  }
  return days;
}

function checkRequirement(requirement: string): JdRow {
  const value = requirement.toLowerCase();
  if (/java|spring/.test(value)) {
    return { requirement, result: "Match", proof: "Java backend work at Gartner" };
  }
  if (/search|opensearch|elasticsearch/.test(value)) {
    return { requirement, result: "Match", proof: "Search platform work at Gartner" };
  }
  if (/rag|genai|llm|\bai\b|agent/.test(value)) {
    return { requirement, result: "Match", proof: "AskGartner uses RAG and agent loops" };
  }
  if (/lead/.test(value)) {
    return { requirement, result: "Partial", proof: "Lead Engineer at OfBusiness. Team size is not given." };
  }
  return { requirement, result: "Not found", proof: "Not in the resume. He may still have this skill." };
}

function readRequirements(jobDescription: string) {
  const lines = jobDescription.split("\n").map((line) => line.trim());
  const bullets = lines
    .filter((line) => /^[-*•]/.test(line))
    .map((line) => line.replace(/^[-*•]\s*/, ""))
    .filter(Boolean);
  const requirements = bullets.length > 0 ? bullets : lines.filter(Boolean);
  return requirements.slice(0, 12);
}

export function runMockAgent({ candidate, kind, text, askedBefore }: AgentInput): AgentOutput {
  const name = candidate.firstName;

  // Tool result: HR confirmed a slot, so the booking tool can run.
  if (kind === "book") {
    return {
      text: `Interview booked for ${text}. In this demo, nothing is added to a real calendar.`,
      card: { type: "booked", slot: text },
      countsAsQuestion: false,
      steps: [
        { name: "Human approval", tag: "Approved", tone: "ok", detail: "HR confirmed the slot." },
        { name: "schedule_interview", tag: "Done", tone: "ok", detail: "The booking tool ran after approval." },
      ],
    };
  }

  // The job description is DATA. It never goes into the question rules below.
  if (kind === "jd") {
    const rows = readRequirements(text).map(checkRequirement);
    const matches = rows.filter((row) => row.result === "Match").length;
    const partial = rows.filter((row) => row.result === "Partial").length;
    return {
      text: `${name}'s resume matches ${matches} of the ${rows.length} requirements. ${partial} ${partial === 1 ? "is a partial match" : "are partial matches"}. For anything not found, ask him directly.`,
      card: { type: "jdResult", rows },
      countsAsQuestion: true,
      steps: [
        { name: "Guardrail", tag: "Passed", tone: "ok", detail: "Reads the job description as data, not as instructions." },
        { name: "Semantic cache", tag: "Skipped", tone: "warn", detail: "Each job description is different, so run the full flow." },
        { name: "extract_requirements", tag: `${rows.length} found`, tone: "ok", detail: "Turned the job description into a clear list." },
        { name: "Retriever", tag: `${rows.length} searches`, tone: "ok", detail: "Searched the resume once for each requirement." },
        { name: "Generator", tag: "Done", tone: "ok", detail: "Gave each requirement a result, with proof from the chunks." },
        { name: "show_jd_match", tag: "Done", tone: "ok", detail: "Drew the requirement check card." },
      ],
    };
  }

  const question = text.toLowerCase();

  if (/ignore (your|all|previous)|python|sorting program|recipe|weather|joke/.test(question)) {
    return {
      text: `I can only answer questions about ${name}'s resume.`,
      card: { type: "blocked", suggestions },
      countsAsQuestion: true,
      steps: [
        { name: "Guardrail", tag: "Blocked", tone: "warn", detail: "The question is off-topic or tries to change the rules." },
        { name: "Retrieval and generation", tag: "Not run", tone: "muted", detail: "No search and no answer from the main model." },
      ],
    };
  }

  const hiring = text.match(/hiring for (?:a |an )?(.+?)[.!]?$/i);
  if (hiring) {
    const fact = `Hiring for: ${hiring[1]}`;
    return {
      text: `Noted. I will remember this in your other chats too: ${hiring[1]}.`,
      countsAsQuestion: true,
      memoryFact: fact,
      steps: [
        guardrailPassed,
        { name: "Long-term memory", tag: "Saved", tone: "ok", detail: "Saved this fact for all chats from this phone number." },
      ],
    };
  }

  if (/job description|\bjd\b/.test(question)) {
    return {
      text: `Sure. Paste the job description, and I will check each requirement against ${name}'s resume.`,
      card: { type: "jdInput" },
      countsAsQuestion: false,
      steps: [
        guardrailPassed,
        { name: "Planner", tag: "Needs input", tone: "warn", detail: "It asks HR for the job description before calling any tool." },
      ],
    };
  }

  if (/book|schedule|interview|\bcall\b|slot/.test(question)) {
    const [first, second, third] = nextWorkingDays(3);
    return {
      text: `Yes. ${name} is free at these times. Pick one, and I will book it after you confirm.`,
      card: {
        type: "slots",
        slots: [
          { id: "slot-1", day: first, time: "11:00 AM" },
          { id: "slot-2", day: second, time: "3:00 PM" },
          { id: "slot-3", day: third, time: "11:30 AM" },
        ],
      },
      countsAsQuestion: true,
      steps: [
        { name: "Guardrail", tag: "Passed", tone: "ok", detail: "Booking a call with the candidate is allowed." },
        { name: "Semantic cache", tag: "Skipped", tone: "warn", detail: "Free times change, so this answer must be live." },
        { name: "Planner", tag: "Tool chosen", tone: "ok", detail: "This request needs an action, so it picked a tool." },
        { name: "check_availability", tag: "Done", tone: "ok", detail: "Read free times from a fake calendar." },
        { name: "schedule_interview", tag: "Waiting", tone: "warn", detail: "Runs only after HR confirms a slot." },
      ],
    };
  }

  if (/java|spring|backend/.test(question)) {
    return {
      text: `${name} works on Java backend services at Gartner. He was also a backend engineer at OnGrid from 2020 to 2023.`,
      sources: ["Resume, page 1"],
      countsAsQuestion: true,
      steps: resumeAnswerSteps(askedBefore),
    };
  }

  if (/rag|genai|\bai\b|agent|llm/.test(question)) {
    return {
      text: `At Gartner, ${name} works on AskGartner. It is a GenAI assistant that uses RAG over stored chunks, guardrails and agent loops.`,
      sources: ["Work history"],
      countsAsQuestion: true,
      steps: resumeAnswerSteps(askedBefore),
    };
  }

  if (/search|experience|career|background|work|timeline/.test(question)) {
    return {
      text: `Yes. At Gartner, ${name} works on Java backend services and search platforms. He also works on AskGartner, a GenAI assistant that uses RAG, guardrails and agent loops.`,
      card: {
        type: "timeline",
        items: [
          { years: "2020–2023", company: "OnGrid", role: "Backend Engineer" },
          { years: "2023–2025", company: "OfBusiness", role: "Lead Engineer" },
          { years: "Feb 2026–now", company: "Gartner", role: "Senior Software Engineer" },
        ],
      },
      sources: ["Resume, page 1", "Work history"],
      countsAsQuestion: true,
      steps: resumeAnswerSteps(askedBefore, {
        name: "show_career_timeline",
        tag: "Done",
        tone: "ok",
        detail: "Returned data for the timeline card.",
      }),
    };
  }

  return {
    text: "This demo uses a fake agent, so it only understands a few topics. Try one of these questions.",
    card: { type: "suggestions", suggestions },
    countsAsQuestion: true,
    steps: [
      guardrailPassed,
      { name: "Fake agent", tag: "No match", tone: "warn", detail: "The real LangGraph agent will replace these word checks." },
    ],
  };
}
