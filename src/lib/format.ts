// Dates are shown in Pacific time for now (the site's home time zone).
export function formatDateTime(date: Date) {
  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Los_Angeles",
    timeZoneName: "short",
  });
}
