/**
 * Trips backed by Firestore (`orgTrips`) so they're shared across the team and
 * scoped per supervisor: an owner/manager sees every trip and who handles it;
 * a supervisor sees only their own routes. Rules mirror this (see firestore.rules).
 */
import {
  addDoc, collection, doc, onSnapshot, query, updateDoc, where,
} from 'firebase/firestore';
import { db } from '../firebase.js';
import type { Trip, TripPoint, TripStatus } from './mocks.js';
import { trips as seedTrips } from './mocks.js';
import { genVrId } from './trip.js';

interface Scope { uid: string; role: string }
const isAdmin = (role: string) => role === 'owner' || role === 'manager';

function fromSnap(id: string, d: Record<string, unknown>): Trip {
  return {
    id,
    lr: (d.lr as string) ?? '',
    date: (d.date as string) ?? '',
    from: (d.from as string) ?? '',
    to: (d.to as string) ?? '',
    driver: (d.driver as string) ?? '',
    vehicleReg: (d.vehicleReg as string) ?? '',
    material: (d.material as string) ?? '',
    weightKg: (d.weightKg as number) ?? 0,
    freightPaise: (d.freightPaise as number) ?? 0,
    status: (d.status as TripStatus) ?? 'assigned',
    ewayBill: (d.ewayBill as boolean) ?? false,
    ownerUid: (d.ownerUid as string) ?? '',
    ownerName: (d.ownerName as string) ?? '',
    createdAtMs: (d.createdAtMs as number) ?? 0,
    ...(d.vrId ? { vrId: d.vrId as string } : {}),
    ...(d.customer ? { customer: d.customer as string } : {}),
    ...(d.points ? { points: d.points as TripPoint[] } : {}),
    ...(d.stepIndex != null ? { stepIndex: d.stepIndex as number } : {}),
    ...(d.remark ? { remark: d.remark as string } : {}),
  };
}

/** Live subscription, scoped by role. Admins get all trips; others only theirs. */
export function watchTrips(scope: Scope, cb: (trips: Trip[]) => void): () => void {
  const q = isAdmin(scope.role)
    ? query(collection(db, 'orgTrips'))
    : query(collection(db, 'orgTrips'), where('ownerUid', '==', scope.uid));
  return onSnapshot(q, (qs) => {
    cb(qs.docs.map((d) => fromSnap(d.id, d.data())).sort((a, b) => (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0)));
  });
}

/** LR is a short, readable, unique-enough receipt number. */
function genLr(): string {
  return `LR-${(Date.now() % 100000).toString().padStart(5, '0')}`;
}

/** Strip undefined keys — Firestore rejects them. */
function clean<T extends Record<string, unknown>>(obj: T): T {
  Object.keys(obj).forEach((k) => obj[k] === undefined && delete obj[k]);
  return obj;
}

export async function addTripDoc(t: Omit<Trip, 'lr' | 'vrId' | 'id'>, scope: Scope, handledBy?: { uid: string; name: string }): Promise<void> {
  const owner = handledBy ?? { uid: scope.uid, name: '' };
  await addDoc(collection(db, 'orgTrips'), clean({
    ...t,
    lr: genLr(),
    vrId: genVrId(),
    ownerUid: owner.uid,
    ownerName: owner.name,
    createdAtMs: Date.now(),
  }));
}

export async function updateTripDoc(id: string, patch: Partial<Trip>): Promise<void> {
  await updateDoc(doc(db, 'orgTrips', id), clean({ ...patch }));
}

/** One-time demo seed: writes the sample trips to the owner's account if empty. */
export async function seedTripsFor(scope: Scope): Promise<void> {
  const base = Date.now();
  await Promise.all(seedTrips.map((t, i) =>
    addDoc(collection(db, 'orgTrips'), clean({
      ...t,
      ownerUid: scope.uid,
      ownerName: scope.role === 'owner' ? 'Owner' : '',
      createdAtMs: base - i * 1000,
    }))));
}
