"use client";

import { useState, useTransition, type FormEvent } from "react";
import { startHrChat } from "@/app/hr/[shareId]/actions";

type Props = { shareId: string; firstName: string };

export function HrStartForm({ shareId, firstName }: Props) {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await startHrChat(shareId, phone);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <label htmlFor="hr-phone" className="text-sm font-medium">
        Your phone number
      </label>
      <input
        id="hr-phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        required
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        placeholder="+91 98765 43210"
        className="min-h-12 rounded-lg border border-line-strong bg-white px-3.5 text-base"
      />
      {error ? (
        <p role="alert" className="text-sm text-warn">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending || phone.trim().length < 6}
        className="min-h-12 rounded-lg bg-accent px-5 text-base font-medium text-white hover:bg-accent-strong disabled:opacity-60"
      >
        {pending ? "Opening…" : `Chat about ${firstName}'s resume`}
      </button>
      <p className="text-[13px] leading-normal text-muted">
        We use your number only to keep your chats and your daily question limit. The same number brings your
        chats back.
      </p>
    </form>
  );
}
