/**
 * Truck types — the admin's list.
 *
 * The client's rule: "The drop-down box should be customizable by ADMIN so that
 * the option given by ADMIN should be available for employees." Same shape as
 * the delay reason codes (lib/reasonCodes): the list lives in Firestore, an
 * owner/manager maintains it, everyone else only picks.
 *
 * This is why `Truck.type` is a plain string rather than the fixed VehicleType
 * union — the union is generic marketplace vocabulary (truck/pickup/tempo…),
 * whereas the team actually thinks in box sizes (14FT_TRUCK, 17FT…). A fixed
 * union can't be "customizable by ADMIN" by definition.
 *
 * Ships EMPTY on purpose — nothing here fabricates data. STANDARD_TRUCK_TYPES is
 * the one-click starting point an admin chooses to insert; it deliberately
 * mirrors the seven types existing trucks were saved with, so inserting it can
 * never orphan a record that already exists.
 */
import { addDoc, collection, deleteDoc, doc, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase.js';

export interface TruckType {
  id: string;
  label: string;
  createdAtMs?: number;
}

/** The values existing trucks already carry. Only inserted on an admin's press. */
export const STANDARD_TRUCK_TYPES = [
  'truck', 'pickup', 'tempo', 'mini_truck', 'reefer', 'auto', 'bike',
];

export function watchTruckTypes(cb: (types: TruckType[]) => void): () => void {
  return onSnapshot(query(collection(db, 'orgTruckTypes')), (qs) => {
    cb(qs.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<TruckType, 'id'>) }))
      .sort((a, b) => (a.createdAtMs ?? 0) - (b.createdAtMs ?? 0)));
  });
}

export async function addTruckType(label: string): Promise<void> {
  const l = label.trim();
  if (!l) return;
  await addDoc(collection(db, 'orgTruckTypes'), { label: l, createdAtMs: Date.now() });
}

export async function removeTruckType(id: string): Promise<void> {
  await deleteDoc(doc(db, 'orgTruckTypes', id));
}

/** Insert the standard set, skipping any the admin already has. */
export async function addStandardTruckTypes(existing: TruckType[]): Promise<number> {
  const have = new Set(existing.map((t) => t.label.toLowerCase()));
  const todo = STANDARD_TRUCK_TYPES.filter((t) => !have.has(t.toLowerCase()));
  const base = Date.now();
  await Promise.all(todo.map((label, i) =>
    addDoc(collection(db, 'orgTruckTypes'), { label, createdAtMs: base + i })));
  return todo.length;
}

/** The options to show for a truck, always including whatever it's already set
 *  to — so opening an old record can never silently change its type. */
export function optionsFor(types: TruckType[], current?: string): string[] {
  const labels = types.map((t) => t.label);
  return current && !labels.includes(current) ? [current, ...labels] : labels;
}
