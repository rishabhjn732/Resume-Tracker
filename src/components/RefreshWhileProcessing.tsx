"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// While a resume in the list is still processing, ask the server for a fresh
// list every few seconds. router.refresh() runs the Server Component again
// without a full page reload.
export function RefreshWhileProcessing({ active }: { active: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => router.refresh(), 3000);
    return () => clearInterval(timer);
  }, [active, router]);

  return null;
}
