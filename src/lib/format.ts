// Small helpers to show numbers and dates. Safe in the server and the browser.

export function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// A fixed time zone, so the server and the browser show the same text.
const dateFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

export function formatDate(value: string) {
  return dateFormat.format(new Date(value));
}

export function formatSeconds(milliseconds: number) {
  if (milliseconds < 100) return "<0.1s";
  return `${(milliseconds / 1000).toFixed(1)}s`;
}

const dayFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

// "8 Nov 2026"
export function formatDay(value: string) {
  return dayFormat.format(new Date(value));
}

const timeFormat = new Intl.DateTimeFormat("en-IN", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

// "11:00 am – 11:30 am"
export function formatTimeRange(start: string, end: string) {
  return `${timeFormat.format(new Date(start))} – ${timeFormat.format(new Date(end))}`;
}

const partsFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  weekday: "short",
  timeZone: "Asia/Kolkata",
});

// { day: "10", month: "Nov", weekday: "Tue" } for the date block of an interview.
export function dateParts(value: string) {
  const parts = partsFormat.formatToParts(new Date(value));
  const find = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return { day: find("day"), month: find("month"), weekday: find("weekday") };
}

export function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
