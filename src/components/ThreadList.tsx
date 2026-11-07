"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type ThreadLink = { id: string; title: string };

// LEARN (hook): usePathname reads the current URL, so we can highlight the open chat.
export function ThreadList({ userId, threads }: { userId: string; threads: ThreadLink[] }) {
  const pathname = usePathname();

  return (
    <ul className="flex flex-col gap-1">
      {threads.map((thread) => {
        const href = `/c/${userId}/chat/${thread.id}`;
        const isOpen = pathname === href;
        return (
          <li key={thread.id}>
            <Link
              href={href}
              aria-current={isOpen ? "page" : undefined}
              className={`flex min-h-11 items-center rounded-lg px-3 py-2 text-sm break-words ${
                isOpen ? "bg-accent-soft font-medium text-accent-strong" : "hover:bg-ground"
              }`}
            >
              {thread.title}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
