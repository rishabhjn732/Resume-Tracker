import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getMe } from "./backend";

// Login for CANDIDATES. (HR people use only a phone number. See session.ts.)

export const SESSION_COOKIE = "session_token";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days, the same as the backend token

// Returns OUR login token from the cookie, or undefined.
export async function getSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value;
}

// Returns the logged-in user, or null if nobody is logged in.
export async function getCurrentUser() {
  const token = await getSessionToken();
  if (!token) return null;
  return getMe(token);
}

// For pages that need login AND need to call the backend as this user.
// If nobody is logged in, go to the login page.
// SPRING: like a page protected by Spring Security.
//
// LEARN (cache): React's cache() remembers the result for ONE request.
// So the header and the page can both call requireSession(), but /api/me is called once.
export const requireSession = cache(async () => {
  const token = await getSessionToken();
  const user = token ? await getMe(token) : null;
  if (!token || !user) redirect("/");
  return { user, token };
});

export async function requireUser() {
  const { user } = await requireSession();
  return user;
}
