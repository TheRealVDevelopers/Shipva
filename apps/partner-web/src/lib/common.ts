/**
 * Shared reference data — customers, drivers, trucks and truck owners — backed
 * by Firestore so it's common to the whole org: everyone reads the same list and
 * anything one member adds is instantly visible to the rest (unlike trips/tours,
 * this data is NOT scoped per member). Firestore rules mirror this: any org
 * member may read/create/update; only admins delete. See firestore.rules.
 */
import {
  addDoc, collection, deleteDoc, doc, onSnapshot, query, updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase.js';
import type { FleetDriver, Truck } from './mocks.js';
import type { Customer, AttachedTruck } from './store.js';

/** Strip undefined keys — Firestore rejects them. */
function clean(obj: Record<string, unknown>): Record<string, unknown> {
  Object.keys(obj).forEach((k) => obj[k] === undefined && delete obj[k]);
  return obj;
}

/** Prepare a record for writing: drop the client-side id (Firestore assigns the
 *  doc id), stamp an ordering timestamp, and strip undefined. */
function prep(item: Record<string, unknown>, createdAtMs: number): Record<string, unknown> {
  const rest: Record<string, unknown> = { ...item, createdAtMs };
  delete rest.id;
  return clean(rest);
}

/** A shared org collection with the same read-all / write-all access for every
 *  member. `T` carries a client `id` that maps to the Firestore doc id (some
 *  records, e.g. an Expense, only gain their id on the way back out — hence the
 *  optional constraint). Reused by lib/money for the org's shared money data. */
export function sharedCollection<T extends { id?: string }>(name: string) {
  const ref = () => collection(db, name);
  return {
    /** Live subscription; newest-added first (by createdAtMs). */
    watch(cb: (list: T[]) => void): () => void {
      return onSnapshot(query(ref()), (qs) => {
        cb(qs.docs
          .map((d) => ({ raw: d.data(), id: d.id }))
          .sort((a, b) => ((b.raw.createdAtMs as number) ?? 0) - ((a.raw.createdAtMs as number) ?? 0))
          .map(({ raw, id }) => ({ ...raw, id } as unknown as T)));
      });
    },
    /** Add one record; returns the new doc id. */
    async add(item: Omit<T, 'id'>): Promise<string> {
      const r = await addDoc(ref(), prep(item as Record<string, unknown>, Date.now()));
      return r.id;
    },
    /** Patch a record in place. */
    async update(id: string, patch: Partial<T>): Promise<void> {
      await updateDoc(doc(db, name, id), clean({ ...(patch as Record<string, unknown>) }));
    },
    /** Delete a record. Rules allow this for owner/manager only. */
    async remove(id: string): Promise<void> {
      await deleteDoc(doc(db, name, id));
    },
  };
}

export const customersCol = sharedCollection<Customer>('orgCustomers');
export const driversCol = sharedCollection<FleetDriver>('orgDrivers');
export const trucksCol = sharedCollection<Truck>('orgTrucks');
export const ownersCol = sharedCollection<AttachedTruck>('orgOwners');
