// Shared TypeScript types. A type describes the shape of our data.

// The logged-in candidate, from GET /api/me on the backend.
export type User = {
  id: number;
  email: string;
  name: string;
  pictureUrl: string | null;
};

// A candidate whose resume HR can chat with, from GET /api/candidates/{userId}.
export type Candidate = {
  userId: string;
  name: string;
  title: string;
  firstName: string;
};

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

// ----- Resumes (from the backend /api/resumes) -----

export type ResumeStepStatus = "waiting" | "running" | "done" | "failed";

// One line in the "how we processed your resume" timeline.
export type ResumeStep = {
  key: string;
  label: string;
  status: ResumeStepStatus;
  detail: string | null;
  startedAt: string | null;
  finishedAt: string | null;
};

export type ResumeSummary = {
  fullName: string | null;
  headline: string | null;
  totalExperience: string | null;
  overview: string;
  experienceSummary: string;
  skillGroups: { category: string; skills: string[] }[];
  experiences: {
    company: string;
    role: string;
    start: string | null;
    end: string | null;
    location: string | null;
    highlights: string[];
  }[];
  education: { degree: string; institution: string; year: string | null }[];
  certifications: { name: string; issuer: string | null; year: string | null }[];
  contact: {
    email: string | null;
    phone: string | null;
    location: string | null;
    linkedin: string | null;
    github: string | null;
    website: string | null;
  };
};

export type ResumeChunk = {
  index: number;
  section: string;
  content: string;
  vectorPreview: number[];
  dimensions: number;
};

export type ResumeStatus = "processing" | "ready" | "failed";

export type ResumeDetail = {
  id: number;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  pageCount: number | null;
  status: ResumeStatus;
  error: string | null;
  steps: ResumeStep[];
  summary: ResumeSummary | null;
  chunks: ResumeChunk[];
  createdAt: string;
};

export type ResumeListItem = {
  id: number;
  fileName: string;
  status: ResumeStatus;
  fullName: string | null;
  headline: string | null;
  skillCount: number;
  createdAt: string;
};

export type ResumeList = {
  items: ResumeListItem[];
  limit: number;
  // Set when the backend says resume upload is not set up yet.
  unavailableReason?: string;
};

// ----- Test chat (the candidate checks the chat before sharing it) -----
// These come from the backend APIs planned for the next step:
//   GET  /api/resumes/{id}/test-chat
//   POST /api/resumes/{id}/test-chat                      { question }
//   PUT  /api/resumes/{id}/test-chat/{messageId}/feedback { verdict }

// One step of how an answer was made: "Checked the question", "Searched your resume"...
export type ChatStep = {
  key: string;
  label: string;
  status: "passed" | "warning" | "skipped";
  tag: string; // short text on the right, like "2 parts" or "3.8s"
  detail: string;
};

export type Verdict = "right" | "wrong";

export type TestChatMessage = {
  id: number;
  question: string;
  answer: string;
  // answered: found parts of the resume. not_found: the resume does not say.
  // blocked: the guardrail stopped an off-topic question.
  outcome: "answered" | "not_found" | "blocked";
  sources: { section: string; chunkIndex: number }[];
  steps: ChatStep[];
  verdict: Verdict | null;
  createdAt: string;
};

export type TestChat = {
  limit: number; // 8
  used: number;
  messages: TestChatMessage[];
};

// ----- HR and interviews -----
// From the planned APIs:
//   GET   /api/resumes/{id}/hr
//   PATCH /api/resumes/{id}/hr  { linkEnabled }

export type HrInterview = {
  id: number;
  startsAt: string;
  endsAt: string;
  hrPhone: string; // already masked by the backend, like "+91 98••• ••210"
  topics: string[];
  status: "booked" | "done" | "cancelled";
};

export type HrPerson = {
  phone: string; // masked
  lastTopic: string | null;
  questionsToday: number;
  lastSeenAt: string;
};

export type HrOverview = {
  shareId: string;
  linkEnabled: boolean;
  dailyQuestionLimit: number; // 20
  freeTimes: string | null; // like "Mon–Fri, 10:00 AM – 6:00 PM (India time)"
  interviews: HrInterview[];
  people: HrPerson[];
};
