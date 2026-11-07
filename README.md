# Resume Assistant: Frontend

This is a Next.js project for learning. Login and candidate data come from the FastAPI backend. The chat answers still come from a fake agent.

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
2. On the dashboard, click **Open the HR view**.
3. Enter a phone number, like `+91 98765 43210`.
4. Ask: `Does he have search experience?`
5. Ask the same question again to see a cache hit.
6. Try `Book a 30-minute call` and `Compare with my job description`.

To learn from the code, search for `LEARN` in the `src` folder.

## URLs and files

| URL | File | Runs where |
|---|---|---|
| `/` | `src/app/page.tsx` | Server |
| `/dashboard` | `src/app/dashboard/page.tsx` | Server, with small browser parts |
| `/c/rishabh-jain-4821` | `src/app/c/[userId]/page.tsx` | Server, with a browser form |
| `/c/rishabh-jain-4821/chat/abc123` | `src/app/c/[userId]/chat/[threadId]/page.tsx` | Server, then `ChatWindow` in the browser |
| `POST /api/chat` | `src/app/api/chat/route.ts` | Server only |

## Fake parts to replace

| Fake now | Real later | File |
|---|---|---|
| Word checks | FastAPI and LangGraph | `src/lib/mock-agent.ts` |
| Chats and limits in server memory | Postgres | `src/lib/store.ts` |
| Sample resume on the dashboard | Your own uploaded resume | `src/lib/mock-data.ts` |

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
