import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getMe } from "./backend";

// Login for CANDIDATES. (HR people use only a phone number. See session.ts.)

export const SESSION_COOKIE = "session_token";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days, the same as the backend token

// Returns the logged-in user, or null if nobody is logged in.
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return getMe(token);
}

// For pages that need login. If nobody is logged in, go to the login page.
// SPRING: like a page protected by Spring Security.
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  return user;
}
