"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCandidate } from "@/lib/backend";
import { HR_COOKIE, requireHrPhone } from "@/lib/session";
import { getOrCreateEmptyThread } from "@/lib/store";

// LEARN (Server Action): "use server" makes these functions run on the server,
// even when a browser form calls them. You don't need to write a fetch call.

export type EntryState = { error: string | null };

export async function enterChat(
  userId: string,
  _previousState: EntryState,
  formData: FormData,
): Promise<EntryState> {
  const candidate = await getCandidate(userId);
  if (!candidate) return { error: "This candidate link is not valid." };

  const phone = String(formData.get("phone") ?? "").replace(/[\s-]/g, "");
  if (!/^\+?\d{10,15}$/.test(phone)) {
    return { error: "Enter a valid phone number, like +91 98765 43210." };
  }

  // httpOnly means browser JavaScript cannot read this cookie.
  const cookieStore = await cookies();
  cookieStore.set(HR_COOKIE, phone, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  redirect(`/c/${userId}/chat`);
}

export async function createThread(userId: string) {
  const phone = await requireHrPhone(userId);
  const thread = getOrCreateEmptyThread(userId, phone);

  // Tell Next.js that the sidebar data changed.
  revalidatePath(`/c/${userId}/chat`, "layout");
  redirect(`/c/${userId}/chat/${thread.id}`);
}
