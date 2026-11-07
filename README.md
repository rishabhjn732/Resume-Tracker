# Resume Assistant: Frontend

This is a Next.js project for learning. Everything comes from the FastAPI backend: login, resumes, the test chat, and the HR chat with Google Calendar booking.

## Run the project

You need Node.js 20.9 or newer, and the backend running on port 8000.

1. Copy `.env.example` to `.env.local`, and set `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
2. In Google Cloud Console, add `http://localhost` and `http://localhost:3000` to **Authorized JavaScript origins**.
3. Start the backend. See the backend README.
4. Start the frontend:

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Try this flow:

1. Click the Google button and sign in.
2. Upload a PDF or DOCX resume. Watch the 5 steps while it is read.
3. Open **Test chat** and ask a few questions.
4. Open **HR and interviews**. Click **Connect Google Calendar** and set your free times.
5. Click **Preview as HR** (or open the link in a private window). Enter a phone number, ask about the resume, then ask to book a call and pick a time.
6. Back on **HR and interviews**, the call shows under Interviews with its Google Meet link.

To learn from the code, search for `LEARN` in the `src` folder.

## Pages and files

| URL | What it shows | File |
|---|---|---|
| `/` | Google login | `src/app/page.tsx` |
| `/dashboard` | Opens your newest resume, or the first upload | `src/app/dashboard/page.tsx` |
| `/dashboard/resumes/12` | **My resume**: list, upload, live steps, summary | `src/app/dashboard/resumes/[id]/page.tsx` → `ResumeView.tsx` |
| `/dashboard/resumes/12/chat` | **Test chat**: 8 test questions with right/wrong checks | `.../[id]/chat/page.tsx` → `TestChat.tsx` |
| `/dashboard/resumes/12/hr` | **HR and interviews**: link, Google Calendar, free times, interviews, HR activity | `.../[id]/hr/page.tsx` → `HrOverviewView.tsx`, `CalendarCard.tsx`, `AvailabilityEditor.tsx` |
| `/hr/AbC123` | **The link you send to HR**: whose resume, phone number | `src/app/hr/[shareId]/page.tsx` → `HrStartForm.tsx` |
| `/hr/AbC123/chat/5` | **HR chat**: chats, answers, free times, booking | `src/app/hr/[shareId]/chat/[threadId]/page.tsx` → `HrChat.tsx` |
| `/c/...` | Old HR chat demo with a fake agent. You can delete it (see below) | `src/app/c/[userId]/...` |

The browser never calls FastAPI directly. It calls the Next.js routes in `src/app/api/`, and they pass the request on with the login token (`src/lib/relay.ts`).

## Backend APIs

The full list is in the backend README. The types are in `src/lib/types.ts`.

| Page | Backend URLs |
|---|---|
| Test chat | `GET/POST /api/resumes/{id}/test-chat`, `PUT .../test-chat/{messageId}/feedback` |
| HR and interviews | `GET/PATCH /api/resumes/{id}/hr`, `PUT /api/me/availability`, `POST /api/calendar/google/connect`, `DELETE /api/calendar/google` |
| HR link and chat | `/api/public/shares/{shareId}/...` (no candidate login) |

A `TestChatMessage` is:

```json
{
  "id": 1,
  "question": "Has Rishabh led a team?",
  "answer": "Yes. At OfBusiness he led a team of 3 engineers...",
  "outcome": "answered",
  "sources": [{ "section": "Experience", "chunkIndex": 3 }],
  "steps": [
    { "key": "guardrail", "label": "Checked the question", "status": "passed", "tag": "Passed", "detail": "It is about the resume." },
    { "key": "search", "label": "Searched your resume", "status": "passed", "tag": "1 part", "detail": "Found the closest parts." },
    { "key": "answer", "label": "Wrote the answer", "status": "passed", "tag": "2.6s", "detail": "Used only those parts." }
  ],
  "verdict": null,
  "createdAt": "2026-11-08T10:00:00Z"
}
```

`outcome` is `answered`, `not_found` (the resume doesn't say) or `blocked` (the guardrail stopped an off-topic question). A step's `status` is `passed`, `warning` or `skipped`. An HR message has the same fields, plus `slots` (free times offered) and `interview` (the booked call). Its `outcome` can also be `slots` or `booked`.

## How the HR side works

1. HR opens `/hr/{shareId}` and types a phone number. The `startHrChat` Server Action (`src/app/hr/[shareId]/actions.ts`) sends it to `POST /api/public/shares/{shareId}/visitors` and saves the HR token in an httpOnly cookie named `hr_<shareId>`. Each link has its own cookie, so the candidate's own login cookie is never used here.
2. `HrChat.tsx` sends questions to `src/app/api/hr/[shareId]/...`. Those routes add the HR token (`src/lib/hr-relay.ts`) and pass the request to the backend.
3. When HR asks to book, the backend answers with free times. HR picks one, types a name and email, and clicks **Confirm**. Only then is the call booked: the AI never books by itself.
4. **Connect Google Calendar** (`CalendarCard.tsx`) gets Google's consent URL from the backend and opens it. After **Allow**, Google sends the browser to the backend, and the backend sends it back to `/dashboard/resumes/12/hr?calendar=connected`.

### Remove the old demo

The old fake HR demo is no longer used. You can delete `src/app/c/` and any `src/lib` files that only it imports (search for `from "@/lib/` inside `src/app/c/` first).

## How login works

1. `GoogleLoginButton.tsx` shows Google's button. After sign-in, Google gives the browser an ID token.
2. The `loginWithGoogle` Server Action in `src/app/actions.ts` sends it to the backend: `POST /api/auth/google`.
3. The backend checks it and returns its own login token.
4. Next.js saves that token in an httpOnly cookie, so browser JavaScript can't read it.
5. `requireUser()` in `src/lib/auth.ts` sends the token to `GET /api/me` to find the user.

All backend calls are in `src/lib/backend.ts`. They run on the Next.js server, never in the browser.

## On Vercel

In the Vercel project, open **Settings → Environment Variables** and add `NEXT_PUBLIC_GOOGLE_CLIENT_ID` and `BACKEND_URL`. Then redeploy, because `NEXT_PUBLIC_` values are added when the app is built.

`BACKEND_URL` must be a backend on the internet, not `localhost`.

On the backend (Railway), set `FRONTEND_URL` to your Vercel address, so Google Calendar sends you back to the right site.

HR phone numbers have no OTP. Anyone who types another person's number on the same link can open that person's chats. Add OTP before many real recruiters use the app.
