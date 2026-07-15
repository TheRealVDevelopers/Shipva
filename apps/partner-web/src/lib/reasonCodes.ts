/**
 * Delay reason codes.
 *
 * The client's rule: "Admin should only have the access to type it manually and
 * set it, where employee should have the selected options as given by the
 * Admins — employee can only select." So the list lives in Firestore, an
 * owner/manager maintains it, and everyone else picks from what's there.
 *
 * It ships EMPTY on purpose. Nothing in this app fabricates data any more, and a
 * silently-seeded list would be indistinguishable from one the admin curated.
 * `STANDARD_CODES` is offered as a one-click starting point the admin chooses to
 * insert — that's them setting it, which is what was asked for.
 */
import { addDoc, collection, deleteDoc, doc, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase.js';

export interface ReasonCode {
  id: string;
  label: string;
  createdAtMs?: number;
}

/** Amazon's own list, transcribed from the client's screenshot. Only ever
 *  inserted when an admin presses the button — never automatically. */
export const STANDARD_CODES = [
  'Scheduling Error',
  'Non-standard vehicle',
  'Traffic',
  'Road work or closure',
  'Weather',
  'Dispatch error',
  'Truck involved into an accident',
  'Mechanical truck breakdown',
  'Electrical truck breakdown',
  'Tire puncture burst',
];

export function watchReasonCodes(cb: (codes: ReasonCode[]) => void): () => void {
  return onSnapshot(query(collection(db, 'orgReasonCodes')), (qs) => {
    cb(qs.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<ReasonCode, 'id'>) }))
      .sort((a, b) => (a.createdAtMs ?? 0) - (b.createdAtMs ?? 0)));
  });
}

export async function addReasonCode(label: string): Promise<void> {
  const l = label.trim();
  if (!l) return;
  await addDoc(collection(db, 'orgReasonCodes'), { label: l, createdAtMs: Date.now() });
}

export async function removeReasonCode(id: string): Promise<void> {
  await deleteDoc(doc(db, 'orgReasonCodes', id));
}

/** Insert the standard set, skipping any the admin already has. */
export async function addStandardCodes(existing: ReasonCode[]): Promise<number> {
  const have = new Set(existing.map((c) => c.label.toLowerCase()));
  const todo = STANDARD_CODES.filter((c) => !have.has(c.toLowerCase()));
  const base = Date.now();
  await Promise.all(todo.map((label, i) =>
    addDoc(collection(db, 'orgReasonCodes'), { label, createdAtMs: base + i })));
  return todo.length;
}
