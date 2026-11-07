// FAKE DATA for learning. Later, this data will come from your FastAPI backend.

// Step 3 will link your Google account to your own resume.
// Until then, every logged-in user sees this sample resume.
export async function getMyResume() {
  return {
    userId: "rishabh-jain-4821",
    fileName: "Rishabh_Jain_Resume.pdf",
  };
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
