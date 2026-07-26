/**
 * Trip reminders — the client's point 3: "Send ticket-style notifications
 * 1 hour before scheduled arrival and departure. Clicking the notification
 * should open the trip update screen directly."
 *
 * Each stop on each VRID has a scheduled arrival and departure. One hour
 * before either, the POC who runs the line gets a ticket. Two channels:
 *  • the in-app notification tray (always), and
 *  • a desktop/system notification via the Notifications API, so it lands even
 *    when the tab is in the background.
 *
 * This is client-side and therefore only fires while the app is open on that
 * person's device. Delivering to a closed app needs FCM push plus a service
 * worker and a scheduled Cloud Function; that's a separate piece of work and
 * is deliberately not pretended at here.
 *
 * Fired reminders are remembered in localStorage so reloading the page doesn't
 * replay every ticket for the day.
 */
import type { Tour } from './store.js';

/** How far ahead of a scheduled time the reminder goes out. */
export const LEAD_MS = 60 * 60 * 1000;
/** Fire a reminder that's up to this late — but never replay ancient ones. */
const GRACE_MS = 10 * 60 * 1000;

export interface TripAlert {
  /** Stable per stop-event, so a reminder is only ever sent once. */
  key: string;
  tourId: string;
  tourCode: string;
  vrid: string;
  stop: string;
  kind: 'arrival' | 'departure';
  /** When the thing is scheduled to happen. */
  atMs: number;
}

const SEEN_KEY = 'sarva-trip-alerts-v1';

/** Reminder keys already fired, pruned to today so the list can't grow. */
function loadSeen(): Set<string> {
  try {
    const raw = JSON.parse(localStorage.getItem(SEEN_KEY) ?? '{}') as { day?: string; keys?: string[] };
    const today = new Date().toDateString();
    return raw.day === today ? new Set(raw.keys ?? []) : new Set();
  } catch { return new Set(); }
}

function saveSeen(keys: Set<string>): void {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify({ day: new Date().toDateString(), keys: [...keys] }));
  } catch { /* private mode — reminders just repeat on reload, which is safe */ }
}

/**
 * Every reminder that is due right now across the given runs.
 *
 * "Due" means the scheduled time is between one hour away and ten minutes
 * past — the window keeps a reminder useful if the tab was asleep, without
 * replaying this morning's stops when someone opens the app at six pm. A stop
 * that has already been checked in (or out) is skipped: the point of the
 * reminder is the update that hasn't happened.
 */
export function dueAlerts(tours: Tour[], now = Date.now()): TripAlert[] {
  const out: TripAlert[] = [];
  tours.forEach((t) => {
    if (t.archived || t.draft || t.amzStatus === 'COMPLETED') return;
    (t.legs ?? []).forEach((leg) => {
      leg.stops.forEach((s) => {
        const check = (kind: 'arrival' | 'departure', when?: string, already?: number) => {
          if (!when || already) return;
          const atMs = new Date(when).getTime();
          if (!Number.isFinite(atMs)) return;
          const fireAt = atMs - LEAD_MS;
          if (now < fireAt || now > fireAt + GRACE_MS) return;
          out.push({
            key: `${t.id}:${leg.vrid}:${s.name}:${kind}:${atMs}`,
            tourId: t.id, tourCode: t.tourId, vrid: leg.vrid, stop: s.name, kind, atMs,
          });
        };
        check('arrival', s.arrivalAt, s.actualArrival);
        check('departure', s.departureAt, s.actualDeparture);
      });
    });
  });
  return out;
}

/** Reminders that haven't been sent yet; marks them sent. */
export function takeUnsent(alerts: TripAlert[]): TripAlert[] {
  const seen = loadSeen();
  const fresh = alerts.filter((a) => !seen.has(a.key));
  if (!fresh.length) return [];
  fresh.forEach((a) => seen.add(a.key));
  saveSeen(seen);
  return fresh;
}

export const alertTitle = (a: TripAlert): string =>
  `${a.kind === 'arrival' ? 'Arrival' : 'Departure'} in 1 hour · ${a.vrid}`;

export const alertBody = (a: TripAlert): string => {
  const t = new Date(a.atMs).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${a.stop} — scheduled ${t}. ${a.tourCode}: open and update.`;
};

/**
 * Ask for desktop-notification permission. Called from a user gesture (the
 * bell menu) — browsers reject a bare prompt on page load, and nagging on
 * first paint is obnoxious anyway.
 */
export async function requestAlertPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  return (await Notification.requestPermission()) === 'granted';
}

export const alertsEnabled = (): boolean =>
  'Notification' in window && Notification.permission === 'granted';

/** Show a system notification; clicking it opens the run's update screen. */
export function showDesktopAlert(a: TripAlert, onOpen: () => void): void {
  if (!alertsEnabled()) return;
  try {
    const n = new Notification(alertTitle(a), {
      body: alertBody(a),
      tag: a.key,          // replaces rather than stacks duplicates
      requireInteraction: true,
    });
    n.onclick = () => { window.focus(); onOpen(); n.close(); };
  } catch { /* some browsers throw without a service worker; the in-app tray still fires */ }
}
