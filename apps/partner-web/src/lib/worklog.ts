/**
 * Work log — free-text entries a member adds as they finish work ("what I did
 * and when"). The owner sees each member's log in Team & Roles and on the
 * dashboard. Backed by Firestore `orgWorklog`.
 */
import { addDoc, collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase.js';
import { todayKey } from './activity.js';

export interface WorklogEntry {
  id: string;
  uid: string;
  name: string;
  date: string;
  text: string;
  atMs: number;
}

function fromSnap(id: string, d: Record<string, unknown>): WorklogEntry {
  return {
    id,
    uid: (d.uid as string) ?? '',
    name: (d.name as string) ?? '',
    date: (d.date as string) ?? '',
    text: (d.text as string) ?? '',
    atMs: (d.atMs as number) ?? 0,
  };
}

export async function addWorklog(uid: string, name: string, text: string): Promise<void> {
  const t = text.trim();
  if (!t) return;
  await addDoc(collection(db, 'orgWorklog'), { uid, name, date: todayKey(), text: t, atMs: Date.now() });
}

/** A member's log entries for today (newest first). */
export function watchWorklogFor(uid: string, cb: (entries: WorklogEntry[]) => void): () => void {
  const today = todayKey();
  return onSnapshot(query(collection(db, 'orgWorklog'), where('uid', '==', uid)), (qs) => {
    cb(qs.docs.map((d) => fromSnap(d.id, d.data())).filter((e) => e.date === today).sort((a, b) => b.atMs - a.atMs));
  });
}

export function fmtTime(ms: number): string {
  return new Date(ms).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}
