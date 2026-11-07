"use client";

import { useState } from "react";

// LEARN (Client Component): "use client" means this code also runs in the browser.
// We need it for useState, onClick and the clipboard.
export function CopyLinkButton({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copyLink}
      className="min-h-11 rounded-lg bg-accent px-4 font-medium text-white hover:bg-accent-strong"
    >
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}
