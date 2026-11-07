"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CalendarStatus } from "@/lib/types";

type Props = {
  status: CalendarStatus;
  // After Google, come back to this page.
  returnTo: string;
  // From ?calendar=connected or ?calendar=error after Google sends you back.
  notice: "connected" | "error" | null;
};

// Connect Google Calendar. The browser goes to Google's "Allow" page and comes back here.
export function CalendarCard({ status, returnTo, notice }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function connect() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/calendar/google/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnTo }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || typeof body?.url !== "string") {
        throw new Error(typeof body?.detail === "string" ? body.detail : "Could not start the connection.");
      }
      window.location.assign(body.url); // go to Google
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start the connection.");
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    setError(null);
    const response = await fetch("/api/calendar/google", { method: "DELETE" }).catch(() => null);
    if (!response?.ok) setError("Could not disconnect. Please try again.");
    setBusy(false);
    router.refresh();
  }

  const button = (label: string, onClick: () => void, primary: boolean) => (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={
        primary
          ? "min-h-11 self-start rounded-lg bg-accent px-4 text-[15px] font-medium text-white hover:bg-accent-strong disabled:opacity-60"
          : "min-h-11 self-start rounded-lg border border-line-strong bg-white px-4 text-[15px] font-medium hover:bg-ground disabled:opacity-60"
      }
    >
      {busy ? "Please wait…" : label}
    </button>
  );

  return (
    <section className="flex min-w-0 flex-[1_1_360px] flex-col gap-3 rounded-xl border border-line bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[19px] font-semibold">Google Calendar</h2>
        {status.connected && !status.problem ? (
          <span className="rounded-full bg-ok-soft px-2.5 py-0.5 text-xs font-medium text-ok">Connected</span>
        ) : null}
      </div>

      {notice === "connected" && status.connected ? (
        <p role="status" className="rounded-lg bg-ok-soft px-3.5 py-2.5 text-sm text-ok">
          Google Calendar is connected.
        </p>
      ) : null}
      {notice === "error" ? (
        <p role="alert" className="rounded-lg bg-warn-soft px-3.5 py-2.5 text-sm text-warn">
          Google Calendar was not connected. Please try again.
        </p>
      ) : null}

      {!status.configured ? (
        <p className="text-sm leading-normal text-muted">
          Google Calendar is not set up on the server yet. HR can still book inside your working hours.
        </p>
      ) : status.connected && status.problem ? (
        <>
          <p role="alert" className="rounded-lg bg-warn-soft px-3.5 py-2.5 text-sm text-warn">
            {status.problem}
          </p>
          {button("Connect again", connect, true)}
        </>
      ) : status.connected ? (
        <>
          <p className="text-sm leading-normal text-muted">
            Connected as <span className="font-medium text-ink">{status.email ?? "your Google account"}</span>. HR only
            sees times when you are free, and each booking becomes an event with a Google Meet link.
          </p>
          {button("Disconnect", disconnect, false)}
        </>
      ) : (
        <>
          <p className="text-sm leading-normal text-muted">
            Connect your calendar so HR only sees times when you are free. Each booking becomes an event with a Google
            Meet link, and Google emails the invite to HR.
          </p>
          {button("Connect Google Calendar", connect, true)}
        </>
      )}
      {error ? (
        <p role="alert" className="text-sm text-warn">
          {error}
        </p>
      ) : null}
    </section>
  );
}
