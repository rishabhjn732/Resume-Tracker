# Resume Assistant: Frontend

This is a Next.js project for learning. It uses a fake agent and fake data, so you don't need a backend or an API key yet.

## Run the project

You need Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Try this flow:

1. Click **Continue with Google**. This is a fake login.
2. Click **Open the HR view**.
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
| Data in server memory | Postgres | `src/lib/store.ts` |
| Sample candidate | Backend API | `src/lib/mock-data.ts` |
| Login button | Google login | `src/app/page.tsx` |

Server memory is cleared on every restart, so this version should not be used as a real deployed app.

Phone entry has no OTP. Add OTP before real recruiters use the app, because anyone who enters another person's number can open that person's chats.
