import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getCandidate } from "./mock-data";

export const HR_COOKIE = "hr_phone";

// Find the candidate from the URL. If the ID is wrong, show the 404 page.
export async function requireCandidate(userId: string) {
  const candidate = await getCandidate(userId);
  if (!candidate) notFound();
  return candidate;
}

// HR must enter a phone number first. If not, send them to the entry page.
// DEMO ONLY: there is no OTP, so this does not prove who owns the number.
export async function requireHrPhone(userId: string) {
  const cookieStore = await cookies();
  const phone = cookieStore.get(HR_COOKIE)?.value;
  if (!phone) redirect(`/c/${userId}`);
  return phone;
}
