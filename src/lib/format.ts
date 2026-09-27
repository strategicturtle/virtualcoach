// Dates are shown in Pacific time for now (the site's home time zone).
// Note: Intl rejects dateStyle/timeStyle combined with timeZoneName, so list fields explicitly.
export function formatDateTime(date: Date) {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
    timeZoneName: "short",
  });
}
