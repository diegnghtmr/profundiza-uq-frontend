/** Compact "x ago" / "Yesterday" relative time from an ISO timestamp. */
export function formatRelativeTime(iso: string, now = Date.now()): string {
  const deltaMs = now - Date.parse(iso);
  if (Number.isNaN(deltaMs)) return "";

  const minutes = Math.floor(deltaMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}
