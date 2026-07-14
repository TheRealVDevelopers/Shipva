/**
 * Amazon tours backed by Firestore (`orgTours`), scoped per POC like trips:
 * owner/manager see every line, a POC sees only lines assigned to them.
 *
 * VRID uniqueness is company-wide via an `orgVrids/{VRID}` registry — a VRID
 * can only ever be attached to one tour, even across different POCs (whose
 * scoped reads couldn't otherwise see each other's tours to check).
 */
import {
  addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, query, setDoc, updateDoc, where,
} from 'firebase/firestore';
import { db } from '../firebase.js';
import type { Tour, TourStop } from './store.js';

interface Scope { uid: string; role: string }
const isAdmin = (role: string) => role === 'owner' || role === 'manager';

/** Strip undefined values (Firestore rejects them); recurse into stop objects. */
function cleanStops(stops: TourStop[]): Record<string, unknown>[] {
  return stops.map((s) => {
    const o: Record<string, unknown> = { ...s };
    Object.keys(o).forEach((k) => o[k] === undefined && delete o[k]);
    return o;
  });
}
function clean<T extends Record<string, unknown>>(obj: T): T {
  Object.keys(obj).forEach((k) => obj[k] === undefined && delete obj[k]);
  return obj;
}

function fromSnap(id: string, d: Record<string, unknown>): Tour {
  return {
    id,
    date: (d.date as string) ?? '',
    tourId: (d.tourId as string) ?? '',
    vrId: (d.vrId as string) ?? '',
    seTracker: (d.seTracker as string) ?? '',
    toll: (d.toll as string) ?? '',
    amzEquipmentType: (d.amzEquipmentType as string) ?? '',
    seEquipmentType: (d.seEquipmentType as string) ?? '',
    amzStatus: (d.amzStatus as string) ?? 'PLANNED',
    sarvaStatus: (d.sarvaStatus as string) ?? 'PLANNED',
    present: (d.present as string) ?? 'PRESENT',
    scheduleAdhoc: (d.scheduleAdhoc as string) ?? 'SCHEDULE',
    noLoadLoad: (d.noLoadLoad as string) ?? 'Load',
    advanceAmount: (d.advanceAmount as string) ?? '',
    paidPending: (d.paidPending as string) ?? 'Pending',
    driver: (d.driver as string) ?? '',
    vehicleId: (d.vehicleId as string) ?? '',
    driverNumber: (d.driverNumber as string) ?? '',
    vendorName: (d.vendorName as string) ?? '',
    stops: (d.stops as TourStop[]) ?? [],
    totalManualKm: (d.totalManualKm as string) ?? '',
    amazonRelyKm: (d.amazonRelyKm as string) ?? '',
    gpsKm: (d.gpsKm as string) ?? '',
    remarks: (d.remarks as string) ?? '',
    vrIds: (d.vrIds as string[]) ?? [],
    ownerUid: (d.ownerUid as string) ?? '',
    ownerName: (d.ownerName as string) ?? '',
    createdAtMs: (d.createdAtMs as number) ?? 0,
  };
}

/** Live subscription, role-scoped: admins all tours, POCs only their own. */
export function watchToursFs(scope: Scope, cb: (tours: Tour[]) => void): () => void {
  const q = isAdmin(scope.role)
    ? query(collection(db, 'orgTours'))
    : query(collection(db, 'orgTours'), where('ownerUid', '==', scope.uid));
  return onSnapshot(q, (qs) => {
    cb(qs.docs.map((d) => fromSnap(d.id, d.data())).sort((a, b) => (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0)));
  });
}

const vridKey = (vrid: string) => vrid.trim().toUpperCase();

/** Company-wide duplicate check against the VRID registry. */
export async function vridExists(vrid: string): Promise<boolean> {
  const key = vridKey(vrid);
  if (!key) return false;
  const snap = await getDoc(doc(db, 'orgVrids', key));
  return snap.exists();
}

async function registerVrids(vrids: string[], tourId: string, uid: string): Promise<void> {
  await Promise.all(vrids.map((v) =>
    setDoc(doc(db, 'orgVrids', vridKey(v)), { vrid: vridKey(v), tourId, uid, createdAtMs: Date.now() })));
}

export async function addTourDoc(t: Omit<Tour, 'id'>, scope: Scope, handledBy?: { uid: string; name: string }): Promise<void> {
  const owner = handledBy ?? { uid: scope.uid, name: '' };
  const ref = await addDoc(collection(db, 'orgTours'), clean({
    ...t,
    stops: cleanStops(t.stops),
    ownerUid: owner.uid,
    ownerName: owner.name,
    createdAtMs: Date.now(),
  }));
  await registerVrids(t.vrIds ?? [], ref.id, owner.uid);
}

export async function updateTourDoc(id: string, patch: Partial<Tour>): Promise<void> {
  const p: Record<string, unknown> = { ...patch };
  if (patch.stops) p.stops = cleanStops(patch.stops);
  Object.keys(p).forEach((k) => p[k] === undefined && delete p[k]);
  await updateDoc(doc(db, 'orgTours', id), p);
}

/** Free a VRID back up (admin fixing a typo). */
export async function releaseVrid(vrid: string): Promise<void> {
  await deleteDoc(doc(db, 'orgVrids', vridKey(vrid)));
}
