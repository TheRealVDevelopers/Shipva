/**
 * Presence / screen-time tracking. Each member has one `orgActivity/{uid}_{date}`
 * doc per day recording when they first came online, when they were last seen,
 * how much active time they've clocked, and whether they're on a break. A
 * heartbeat (see PartnerLayout) touches the doc while the tab is visible.
 */
import { collection, doc, getDoc, onSnapshot, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase.js';

/** Only count a gap between heartbeats if it's short enough to mean "still here". */
const CONTINUOUS_GAP_MS = 3 * 60 * 1000;

export interface Activity {
  uid: string;
  name: string;
  date: string;
  firstAtMs: number;
  lastAtMs: number;
  activeMs: number;
  onBreak: boolean;
}

export function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fromSnap(d: Record<string, unknown>): Activity {
  return {
    uid: (d.uid as string) ?? '',
    name: (d.name as string) ?? '',
    date: (d.date as string) ?? '',
    firstAtMs: (d.firstAtMs as number) ?? 0,
    lastAtMs: (d.lastAtMs as number) ?? 0,
    activeMs: (d.activeMs as number) ?? 0,
    onBreak: (d.onBreak as boolean) ?? false,
  };
}

const dayDocId = (uid: string) => `${uid}_${todayKey()}`;

/** Heartbeat: create today's doc or bump last-seen + accumulate active time. */
export async function touchActivity(uid: string, name: string): Promise<void> {
  const id = dayDocId(uid);
  const ref = doc(db, 'orgActivity', id);
  const now = Date.now();
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { uid, name, date: todayKey(), firstAtMs: now, lastAtMs: now, activeMs: 0, onBreak: false });
    return;
  }
  const a = fromSnap(snap.data());
  const gap = now - a.lastAtMs;
  const add = !a.onBreak && gap > 0 && gap < CONTINUOUS_GAP_MS ? gap : 0;
  await updateDoc(ref, { lastAtMs: now, activeMs: a.activeMs + add, name });
}

export async function setBreak(uid: string, name: string, onBreak: boolean): Promise<void> {
  const ref = doc(db, 'orgActivity', dayDocId(uid));
  const snap = await getDoc(ref);
  const now = Date.now();
  if (!snap.exists()) {
    await setDoc(ref, { uid, name, date: todayKey(), firstAtMs: now, lastAtMs: now, activeMs: 0, onBreak });
    return;
  }
  // Reset lastAtMs so a break's duration is never counted as active time.
  await updateDoc(ref, { onBreak, lastAtMs: now });
}

export function watchAllToday(cb: (list: Activity[]) => void): () => void {
  return watchActivityByDate(todayKey(), cb);
}

/** Every member's activity for one day (YYYY-MM-DD) — powers the activity log. */
export function watchActivityByDate(date: string, cb: (list: Activity[]) => void): () => void {
  return onSnapshot(query(collection(db, 'orgActivity'), where('date', '==', date)), (qs) => {
    cb(qs.docs.map((d) => fromSnap(d.data())));
  });
}

/** Break time in a day, derived: the span present minus time counted active.
 *  The model tracks active time and a break flag, not a break tally, so this is
 *  the honest approximation — never negative. */
export function breakMs(a: Activity): number {
  return Math.max(0, (a.lastAtMs - a.firstAtMs) - a.activeMs);
}

export function watchActivity(uid: string, cb: (a: Activity | null) => void): () => void {
  return onSnapshot(doc(db, 'orgActivity', dayDocId(uid)), (snap) => {
    cb(snap.exists() ? fromSnap(snap.data()) : null);
  });
}

/** "Active now" if seen within the continuous window and not on break. */
export function presence(a: Activity | null): 'active' | 'break' | 'offline' {
  if (!a) return 'offline';
  if (a.onBreak) return 'break';
  return Date.now() - a.lastAtMs < CONTINUOUS_GAP_MS ? 'active' : 'offline';
}

/**
 * The 9-hour shift clock -- a continuous timer tracking how far into (or
 * past) a 9-hour shift each employee is, ticking in real time on the
 * dashboard.
 *
 * Elapsed is wall-clock time since the day's first heartbeat (firstAtMs),
 * not activeMs -- a shift runs from when you clocked in, not only the
 * seconds the tab happened to be focused, and it keeps running through a
 * break. It is capped once presence reads "offline" (idle past the
 * continuous-gap window), so a tab left open overnight can't inflate a shift
 * into a false 20-hour reading -- the same honest-approximation rule breakMs()
 * already follows.
 */
export const SHIFT_TARGET_MS = 9 * 60 * 60 * 1000;

export function shiftElapsedMs(a: Activity | null, nowMs: number): number {
  if (!a || !a.firstAtMs) return 0;
  const cap = presence(a) === 'offline' ? a.lastAtMs : nowMs;
  return Math.max(0, cap - a.firstAtMs);
}

/** 0-1, capped at 1 even once into overtime -- for a progress bar. */
export function shiftProgress(elapsedMs: number): number {
  return Math.min(1, elapsedMs / SHIFT_TARGET_MS);
}

export const isOvertime = (elapsedMs: number): boolean => elapsedMs > SHIFT_TARGET_MS;

/** H:MM:SS -- a running shift clock, not a short duration label. */
export function fmtShiftClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

/** "3h 12m left" while short of the target, "+1h 4m over" once past it. */
export function fmtShiftRemaining(elapsedMs: number): string {
  const diff = SHIFT_TARGET_MS - elapsedMs;
  const m = Math.round(Math.abs(diff) / 60000);
  const h = Math.floor(m / 60);
  const label = h > 0 ? (h + 'h ' + (m % 60) + 'm') : (m + 'm');
  return diff >= 0 ? (label + ' left') : ('+' + label + ' over');
}

export function fmtClock(ms: number): string {
  if (!ms) return '—';
  return new Date(ms).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

export function fmtActive(ms: number): string {
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
}
