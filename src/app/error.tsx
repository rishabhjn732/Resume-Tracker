"use client";

import { useEffect } from "react";

// LEARN (special file): If a page throws an error, Next.js shows this instead.
// The most common reason here: the FastAPI backend is not running.
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl font-semibold">Something went wrong</h1>
      <p className="max-w-md text-muted">
        This page could not load its data. If you are running the app on your computer, check that
        the backend is running on port 8000.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="min-h-11 rounded-lg bg-accent px-4 font-medium text-white hover:bg-accent-strong"
      >
        Try again
      </button>
    </main>
  );
}
