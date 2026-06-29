// Display formatters for the ops-web preview UI.
// Money is stored in paise (integer) everywhere; never format a float.

const INR = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/** Paise → "₹47,500" (Indian digit grouping, no decimals). */
export function rupees(paise: number): string {
  return `₹${INR.format(Math.round(paise / 100))}`;
}

/** ISO string → "28 May" */
export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

/** ISO string → "28 May, 2:30 PM" */
export function dateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/** ISO string + reference epoch (ms) → "2h ago" / "just now". */
export function relativeTime(iso: string, now: number): string {
  const diffMs = now - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}
