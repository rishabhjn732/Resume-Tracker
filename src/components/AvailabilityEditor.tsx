"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { Availability } from "@/lib/types";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Props = { availability: Availability; freeTimes: string };

// "Your free times": the working hours HR can book inside.
export function AvailabilityEditor({ availability, freeTimes }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(availability);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleDay(day: number) {
    const days = values.workDays.includes(day)
      ? values.workDays.filter((item) => item !== day)
      : [...values.workDays, day].sort();
    setValues({ ...values, workDays: days });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (values.workDays.length === 0) {
      setError("Choose at least one day.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/me/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        // FastAPI sends a text message, or a list of field problems.
        const detail = typeof body?.detail === "string" ? body.detail : body?.detail?.[0]?.msg;
        throw new Error(detail ?? "Could not save. Please check the times.");
      }
      setOpen(false);
      router.refresh(); // the page shows the new free times
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  const input = "min-h-10 rounded-lg border border-line-strong bg-white px-2.5 text-sm";

  return (
    <section className="flex min-w-0 flex-[1_1_360px] flex-col gap-3 rounded-xl border border-line bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[19px] font-semibold">Your free times</h2>
        {!open ? (
          <button
            type="button"
            onClick={() => {
              setValues(availability);
              setOpen(true);
            }}
            className="min-h-9 px-1 text-sm font-medium text-accent underline"
          >
            Change
          </button>
        ) : null}
      </div>

      {!open ? (
        <>
          <p className="text-[15px] font-medium">{freeTimes}</p>
          <p className="text-sm leading-normal text-muted">
            HR can book {availability.slotMinutes}-minute calls in these hours, at least {availability.minNoticeHours}{" "}
            hours ahead and up to {availability.daysAhead} days ahead.
          </p>
        </>
      ) : (
        <form onSubmit={save} className="flex flex-col gap-4">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">Days</legend>
            <div className="flex flex-wrap gap-1.5">
              {DAYS.map((name, day) => {
                const on = values.workDays.includes(day);
                return (
                  <label
                    key={name}
                    className={`inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-sm ${on ? "border-accent bg-accent-soft text-accent-strong" : "border-line bg-white"}`}
                  >
                    <input type="checkbox" checked={on} onChange={() => toggleDay(day)} className="sr-only" />
                    {name}
                  </label>
                );
              })}
            </div>
          </fieldset>
          <div className="flex flex-wrap gap-4">
            <label className="flex flex-col gap-1 text-sm font-medium">
              From
              <input
                type="time"
                value={values.workStart}
                onChange={(event) => setValues({ ...values, workStart: event.target.value })}
                className={input}
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              To
              <input
                type="time"
                value={values.workEnd}
                onChange={(event) => setValues({ ...values, workEnd: event.target.value })}
                className={input}
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Call length
              <select
                value={values.slotMinutes}
                onChange={(event) => setValues({ ...values, slotMinutes: Number(event.target.value) })}
                className={input}
              >
                {[15, 30, 45, 60].map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes} minutes
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex flex-col gap-1 text-sm font-medium">
              Notice (hours)
              <input
                type="number"
                min={0}
                max={168}
                value={values.minNoticeHours}
                onChange={(event) => setValues({ ...values, minNoticeHours: Number(event.target.value) })}
                className={`${input} w-28`}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Days ahead
              <input
                type="number"
                min={1}
                max={60}
                value={values.daysAhead}
                onChange={(event) => setValues({ ...values, daysAhead: Number(event.target.value) })}
                className={`${input} w-28`}
              />
            </label>
          </div>
          <p className="text-[13px] text-muted">Times are in {values.timezone === "Asia/Kolkata" ? "India time" : values.timezone}.</p>
          {error ? (
            <p role="alert" className="text-sm text-warn">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="min-h-10 rounded-lg bg-accent px-4 text-sm font-medium text-white hover:bg-accent-strong disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={saving}
              className="min-h-10 rounded-lg border border-line-strong bg-white px-4 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
