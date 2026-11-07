# Resume Assistant: Frontend

This is a Next.js project for learning. Login and resumes come from the FastAPI backend. The old HR chat demo under `/c/...` still uses a fake agent.

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
3. Open **Test chat** and ask a few questions (needs the chat API, see below).
4. Open **HR and interviews** to copy your HR link (needs the HR API, see below).

To learn from the code, search for `LEARN` in the `src` folder.

## Pages and files

| URL | What it shows | File |
|---|---|---|
| `/` | Google login | `src/app/page.tsx` |
| `/dashboard` | Opens your newest resume, or the first upload | `src/app/dashboard/page.tsx` |
| `/dashboard/resumes/12` | **My resume**: list, upload, live steps, summary | `src/app/dashboard/resumes/[id]/page.tsx` → `ResumeView.tsx` |
| `/dashboard/resumes/12/chat` | **Test chat**: 8 test questions with right/wrong checks | `.../[id]/chat/page.tsx` → `TestChat.tsx` |
| `/dashboard/resumes/12/hr` | **HR and interviews**: link, interviews, HR activity | `.../[id]/hr/page.tsx` → `HrOverviewView.tsx` |
| `/c/...` | Old HR chat demo (fake agent) | `src/app/c/[userId]/...` |

The browser never calls FastAPI directly. It calls the Next.js routes in `src/app/api/`, and they pass the request on with the login token (`src/lib/relay.ts`).

## APIs the backend must add next

The Test chat and HR pages are built, but the backend doesn't have these APIs yet. Until it does, those pages say "not switched on yet". All of them need `Authorization: Bearer <token>`, and only the resume's owner may use them. The types are in `src/lib/types.ts`.

| Method and URL | Body | Answer |
|---|---|---|
| `GET /api/resumes/{id}/test-chat` | none | `{ limit: 8, used, messages: TestChatMessage[] }` |
| `POST /api/resumes/{id}/test-chat` | `{ question }` | `201` with one `TestChatMessage`, or `429` when all 8 are used |
| `PUT /api/resumes/{id}/test-chat/{messageId}/feedback` | `{ verdict: "right" \| "wrong" \| null }` | `204` |
| `GET /api/resumes/{id}/hr` | none | `{ shareId, linkEnabled, dailyQuestionLimit, freeTimes, interviews, people }` |
| `PATCH /api/resumes/{id}/hr` | `{ linkEnabled }` | `200` |

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

`outcome` is `answered`, `not_found` (the resume doesn't say) or `blocked` (the guardrail stopped an off-topic question). A step's `status` is `passed`, `warning` or `skipped`.

## How login works

1. `GoogleLoginButton.tsx` shows Google's button. After sign-in, Google gives the browser an ID token.
2. The `loginWithGoogle` Server Action in `src/app/actions.ts` sends it to the backend: `POST /api/auth/google`.
3. The backend checks it and returns its own login token.
4. Next.js saves that token in an httpOnly cookie, so browser JavaScript can't read it.
5. `requireUser()` in `src/lib/auth.ts` sends the token to `GET /api/me` to find the user.

All backend calls are in `src/lib/backend.ts`. They run on the Next.js server, never in the browser.

## On Vercel

In the Vercel project, open **Settings → Environment Variables** and add `NEXT_PUBLIC_GOOGLE_CLIENT_ID` and `BACKEND_URL`. Then redeploy, because `NEXT_PUBLIC_` values are added when the app is built.

`BACKEND_URL` must be a backend on the internet, not `localhost`. Until the backend is hosted, login and the HR pages won't work on Vercel.

Server memory is cleared on every restart, so this version should not be used as a real deployed app.

Phone entry has no OTP. Add OTP before real recruiters use the app, because anyone who enters another person's number can open that person's chats.
