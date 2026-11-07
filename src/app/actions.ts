"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";
import { BackendError, loginWithGoogleToken } from "@/lib/backend";

// LEARN (Server Action): These functions run on the Next.js server,
// even when the Google button in the browser calls them.

export type LoginResult = { error: string } | undefined;

export async function loginWithGoogle(credential: string): Promise<LoginResult> {
  if (typeof credential !== "string" || credential.length === 0 || credential.length > 5000) {
    return { error: "Google login failed. Please try again." };
  }

  let accessToken: string;
  try {
    const result = await loginWithGoogleToken(credential);
    accessToken = result.accessToken;
  } catch (error) {
    // The full error appears in the terminal where "npm run dev" runs.
    console.error("Login failed:", error);
    if (error instanceof BackendError && error.status === 401) {
      return { error: "Google login failed. Please try again." };
    }
    return { error: "Login is not working right now. Please try again in a minute." };
  }

  // Save OUR token in a cookie.
  // httpOnly: browser JavaScript can't read it, so other scripts can't steal it.
  // secure: on the real website, the cookie is sent only over https.
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  // redirect() must be outside try/catch, because it works by throwing a special error.
  redirect("/dashboard");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/");
}
