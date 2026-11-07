import { cookies } from "next/headers";

// HR people don't log in with Google. They type a phone number on the share link,
// and the backend gives an HR token for THAT link only. We keep it in an httpOnly cookie,
// one cookie per link, so browser JavaScript can't read it.
export const HR_TOKEN_DAYS = 30;

export function hrCookieName(shareId: string) {
  // Cookie names can't have every character, so keep only safe ones.
  return `hr_${shareId.replace(/[^A-Za-z0-9_-]/g, "")}`;
}

export async function getHrToken(shareId: string) {
  const cookieStore = await cookies();
  return cookieStore.get(hrCookieName(shareId))?.value;
}
