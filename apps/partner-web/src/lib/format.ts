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

/** "2026-07-01" → "01 Jul 2026". Empty in, empty out. */
export function isoToLabel(iso: string): string {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** "01 Jul 2026" (or "1 Jul") → "2026-07-01", for an <input type="date">.
 *  Labels without a year are assumed to be in the current year. */
export function labelToIso(label: string): string {
  const s = label.trim();
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(/\d{4}/.test(s) ? s : `${s} ${new Date().getFullYear()}`);
  if (Number.isNaN(d.getTime())) return '';
  // Use local parts — toISOString() would shift the day across timezones.
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Today as "2026-07-14" in local time (never use toISOString() — it's UTC and
 *  shifts the day for IST). */
export function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Today as a readable label — "14 Jul 2026". */
export const todayFullLabel = (): string => isoToLabel(todayIso());

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
