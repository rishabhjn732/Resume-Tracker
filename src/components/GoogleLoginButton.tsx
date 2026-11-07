"use client";

import Script from "next/script";
import { useRef, useState, useTransition } from "react";
import { loginWithGoogle } from "@/app/actions";

// Small types for the parts of Google's script that we use.
type GoogleCredentialResponse = { credential: string };
type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
      }) => void;
      renderButton: (parent: HTMLElement, options: Record<string, string | number>) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

// NEXT_PUBLIC_ values are added to the browser code when the app is built.
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

// LEARN (Client Component): Google's button runs in the browser.
// 1. Google's script draws the button.
// 2. After sign-in, Google calls our callback with an ID token ("credential").
// 3. We send it to the loginWithGoogle Server Action.
export function GoogleLoginButton() {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function showGoogleButton() {
    if (!CLIENT_ID || !window.google || !buttonRef.current) return;

    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: (response) => {
        setError(null);
        startTransition(async () => {
          const result = await loginWithGoogle(response.credential);
          if (result?.error) setError(result.error);
        });
      },
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      text: "continue_with",
      width: 320,
    });
  }

  if (!CLIENT_ID) {
    return (
      <p role="alert" className="rounded-lg bg-warn-soft p-3 text-sm text-warn">
        Google login is not set up. Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to .env.local, then restart
        npm run dev.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* onReady runs when the script loads, and again each time this page opens. */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={showGoogleButton}
      />
      <div ref={buttonRef} className="min-h-11" />
      {isPending ? (
        <p role="status" className="text-sm text-muted">
          Logging in…
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-lg bg-warn-soft p-3 text-sm font-medium text-warn">
          {error}
        </p>
      ) : null}
    </div>
  );
}
