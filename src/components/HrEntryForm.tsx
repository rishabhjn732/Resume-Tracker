"use client";

import { useActionState } from "react";
import { enterChat, type EntryState } from "@/app/c/[userId]/actions";

const initialState: EntryState = { error: null };

// LEARN (form + Server Action): This form calls enterChat on the server.
// useActionState gives us the error and shows when the form is still working.
export function HrEntryForm({ userId }: { userId: string }) {
  const [state, formAction, isPending] = useActionState(enterChat.bind(null, userId), initialState);

  return (
    <form action={formAction} className="flex flex-col gap-7">
      <div className="flex flex-col gap-2">
        <label htmlFor="hr-phone" className="text-sm font-medium">
          Your phone number
        </label>
        <input
          id="hr-phone"
          name="phone"
          type="tel"
          required
          placeholder="+91 98765 43210"
          aria-invalid={state.error ? true : undefined}
          aria-describedby="hr-phone-help"
          className="min-h-12 rounded-lg border border-line-strong bg-white px-3"
        />
        {state.error ? (
          <p id="hr-phone-help" role="alert" className="text-sm font-medium text-warn">
            {state.error}
          </p>
        ) : (
          <p id="hr-phone-help" className="text-sm text-muted">
            We use it to keep your chats and your limit of 20 questions a day.
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="min-h-12 rounded-lg bg-accent px-4 font-medium text-white hover:bg-accent-strong disabled:opacity-60"
      >
        {isPending ? "Opening chat…" : "Open chat"}
      </button>
    </form>
  );
}
