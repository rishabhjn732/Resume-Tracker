"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { callBackend } from "@/lib/backend";
import { HR_TOKEN_DAYS, hrCookieName } from "@/lib/hr-auth";

export type StartResult = { error: string } | undefined;

// HR typed a phone number. The backend gives an HR token for this link, which we keep in a cookie.
export async function startHrChat(shareId: string, phone: string): Promise<StartResult> {
  if (typeof shareId !== "string" || shareId.length > 64 || typeof phone !== "string" || phone.length > 30) {
    return { error: "Please enter a valid phone number." };
  }

  let token: string;
  try {
    const response = await callBackend(`/api/public/shares/${encodeURIComponent(shareId)}/visitors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      if (typeof body?.detail === "string") return { error: body.detail };
      return { error: "Please enter a valid phone number, like +91 98765 43210." };
    }
    token = body.token;
  } catch {
    return { error: "The chat is not reachable right now. Please try again in a minute." };
  }

  const cookieStore = await cookies();
  cookieStore.set(hrCookieName(shareId), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: HR_TOKEN_DAYS * 24 * 60 * 60,
    path: "/",
  });
  redirect(`/hr/${encodeURIComponent(shareId)}/chat`); // outside try/catch: redirect works by throwing
}

// "Use another number": forget this link's HR token.
export async function leaveHrChat(shareId: string) {
  const cookieStore = await cookies();
  cookieStore.delete(hrCookieName(shareId));
  redirect(`/hr/${encodeURIComponent(shareId)}`);
}
