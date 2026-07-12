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
  return onSnapshot(query(collection(db, 'orgActivity'), where('date', '==', todayKey())), (qs) => {
    cb(qs.docs.map((d) => fromSnap(d.data())));
  });
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

export function fmtClock(ms: number): string {
  if (!ms) return '—';
  return new Date(ms).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

export function fmtActive(ms: number): string {
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
}
