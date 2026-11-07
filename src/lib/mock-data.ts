// FAKE DATA for learning. In phase 1, this data will come from your FastAPI backend.

export type Candidate = {
  userId: string;
  name: string;
  firstName: string;
  title: string;
  fileName: string;
};

const candidates: Candidate[] = [
  {
    userId: "rishabh-jain-4821",
    name: "Rishabh Jain",
    firstName: "Rishabh",
    title: "Senior Software Engineer",
    fileName: "Rishabh_Jain_Resume.pdf",
  },
];

export async function getCandidate(userId: string) {
  // Later this will be: await fetch(`${BACKEND_URL}/candidates/${userId}`)
  return candidates.find((candidate) => candidate.userId === userId) ?? null;
}

export async function getLoggedInCandidate() {
  // Fake login: we always return the sample candidate.
  return candidates[0];
}

export async function getHrActivity() {
  return [
    {
      phone: "+91 98••• ••210",
      questionsToday: "8 of 20",
      lastTopic: "Interview slots",
      interview: "Booked",
    },
    {
      phone: "+91 99••• ••074",
      questionsToday: "20 of 20",
      lastTopic: "Java backend",
      interview: "Not booked",
    },
  ];
}
