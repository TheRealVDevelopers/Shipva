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
import type { Tour, TourStop, TourLeg } from './store.js';

interface Scope { uid: string; role: string; leaderUid?: string }
interface Handler { uid: string; name: string; leaderUid?: string }
const isAdmin = (role: string) => role === 'owner' || role === 'manager';

const stripUndef = (o: Record<string, unknown>) => { Object.keys(o).forEach((k) => o[k] === undefined && delete o[k]); return o; };

/** Strip undefined values (Firestore rejects them); recurse into stop objects. */
function cleanStops(stops: TourStop[]): Record<string, unknown>[] {
  return stops.map((s) => stripUndef({ ...s }));
}
/** Legs carry a nested `ops` object (the per-VRID update) whose fields are all
 *  optional — Firestore rejects `undefined`, so it needs stripping too, not
 *  just the leg and its stops. */
function cleanLegs(legs: TourLeg[]): Record<string, unknown>[] {
  return legs.map((l) => stripUndef({
    ...l,
    stops: l.stops.map((s) => stripUndef({ ...s })),
    ...(l.ops ? { ops: stripUndef({ ...l.ops }) } : {}),
  }));
}
function clean<T extends Record<string, unknown>>(obj: T): T {
  Object.keys(obj).forEach((k) => obj[k] === undefined && delete obj[k]);
  return obj;
}
/** Every VRID on a tour, from legs (preferred) or the legacy vrIds/vrId fields. */
function tourVrids(t: { legs?: TourLeg[] | undefined; vrIds?: string[] | undefined; vrId?: string | undefined }): string[] {
  if (t.legs && t.legs.length) return t.legs.map((l) => l.vrid).filter(Boolean);
  if (t.vrIds && t.vrIds.length) return t.vrIds;
  return t.vrId ? [t.vrId] : [];
}

/**
 * Read a tour back out of Firestore.
 *
 * This spreads the stored document and then pins the fields the app treats as
 * always-present. It used to be a hand-written whitelist, which silently
 * drifted from the `Tour` interface: `podImg`, `podGiven`, `feedback`,
 * `startKm`, `endKm`, `reports` and `archived` were all written but never read
 * back — so a POD photo vanished on the next snapshot and a cancelled route
 * reappeared on the board with its VRIDs already released. Spreading first
 * means a new field on `Tour` works the moment it's written; only fields that
 * must never be undefined need a line below.
 */
function fromSnap(id: string, d: Record<string, unknown>): Tour {
  return {
    ...(d as Partial<Tour>),
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
    leaderUid: (d.leaderUid as string) ?? '',
    createdAtMs: (d.createdAtMs as number) ?? 0,
    legs: (d.legs as TourLeg[]) ?? [],
  };
}

/** Live subscription, role-scoped: admins see all; a Team Leader sees their
 *  whole team; a POC sees only their own. */
export function watchToursFs(scope: Scope, cb: (tours: Tour[]) => void): () => void {
  const q = isAdmin(scope.role) ? query(collection(db, 'orgTours'))
    : scope.role === 'team_leader' ? query(collection(db, 'orgTours'), where('leaderUid', '==', scope.uid))
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

/**
 * Which tour currently holds this VRID, or null if it's free. Editing a route
 * needs this: its own VRIDs are already in the registry, so a plain
 * vridExists() check would reject a route for clashing with itself.
 */
export async function vridHolder(vrid: string): Promise<string | null> {
  const key = vridKey(vrid);
  if (!key) return null;
  const snap = await getDoc(doc(db, 'orgVrids', key));
  return snap.exists() ? ((snap.data() as { tourId?: string }).tourId ?? '') : null;
}

async function registerVrids(vrids: string[], tourId: string, uid: string): Promise<void> {
  await Promise.all(vrids.map((v) =>
    setDoc(doc(db, 'orgVrids', vridKey(v)), { vrid: vridKey(v), tourId, uid, createdAtMs: Date.now() })));
}

/**
 * Save an edited route: re-point the registry at this tour for any VRID it now
 * carries, and release the ones it no longer uses so they can be re-entered.
 */
export async function updateTourLegs(tour: Tour, patch: Partial<Tour>, uid: string): Promise<void> {
  const before = tourVrids(tour);
  const after = tourVrids({ legs: patch.legs ?? tour.legs, vrIds: patch.vrIds ?? tour.vrIds, vrId: patch.vrId ?? tour.vrId });
  await updateTourDoc(tour.id, patch);
  await registerVrids(after, tour.id, uid);
  const dropped = before.filter((v) => !after.map(vridKey).includes(vridKey(v)));
  await Promise.allSettled(dropped.map((v) => releaseVrid(v)));
}

/** Creates the route and returns its new doc id — the caller needs it to hand
 *  the line to a POC as a second step. */
export async function addTourDoc(t: Omit<Tour, 'id'>, scope: Scope, handledBy?: Handler): Promise<string> {
  const owner = handledBy ?? { uid: scope.uid, name: '', leaderUid: scope.leaderUid };
  const payload: Record<string, unknown> = {
    ...t,
    stops: cleanStops(t.stops),
    ownerUid: owner.uid,
    ownerName: owner.name,
    leaderUid: owner.leaderUid || owner.uid,
    createdAtMs: Date.now(),
  };
  if (t.legs) payload.legs = cleanLegs(t.legs);
  const ref = await addDoc(collection(db, 'orgTours'), clean(payload));
  // A draft holds no VRIDs — it's a part-filled form, and claiming its VRIDs
  // would block a real route from using them until the draft is finished.
  if (!t.draft) await registerVrids(tourVrids(t), ref.id, owner.uid);
  return ref.id;
}

export async function updateTourDoc(id: string, patch: Partial<Tour>): Promise<void> {
  const p: Record<string, unknown> = { ...patch };
  if (patch.stops) p.stops = cleanStops(patch.stops);
  if (patch.legs) p.legs = cleanLegs(patch.legs);
  Object.keys(p).forEach((k) => p[k] === undefined && delete p[k]);
  await updateDoc(doc(db, 'orgTours', id), p);
}

/** Free a VRID back up (admin fixing a typo). */
export async function releaseVrid(vrid: string): Promise<void> {
  await deleteDoc(doc(db, 'orgVrids', vridKey(vrid)));
}

/**
 * Delete a tour and release the VRIDs it had claimed. Without the release the
 * VRIDs stay in the company-wide registry forever and re-entering one comes
 * back as "VRID already exists" — for a route that no longer exists.
 */
export async function deleteTourDoc(t: Tour): Promise<void> {
  await deleteDoc(doc(db, 'orgTours', t.id));
  const vrids = tourVrids(t);
  await Promise.allSettled(vrids.map((v) => releaseVrid(v)));
}

/**
 * Cancel/archive a tour — the client's "do not permanently delete". The record
 * stays and is marked CANCELLED (it shows under the Cancelled tab rather than
 * vanishing), while its VRIDs are released so they can be re-assigned. The Tour
 * ID frees up the same way: the duplicate check only looks at live routes.
 */
export async function archiveTourDoc(t: Tour): Promise<void> {
  await updateDoc(doc(db, 'orgTours', t.id), {
    archived: true, archivedAtMs: Date.now(),
    amzStatus: 'CANCELLED', sarvaStatus: 'CANCELLED',
  });
  const vrids = tourVrids(t);
  await Promise.allSettled(vrids.map((v) => releaseVrid(v)));
}

/**
 * Put a cancelled route back on the board. Its VRIDs were released when it was
 * cancelled, so they're re-claimed here — if another route has taken one in the
 * meantime the caller is told which, rather than two routes silently sharing it.
 */
export async function restoreTourDoc(t: Tour): Promise<string | null> {
  const vrids = tourVrids(t);
  for (const v of vrids) {
    const holder = await vridHolder(v);
    if (holder && holder !== t.id) return v;
  }
  await updateDoc(doc(db, 'orgTours', t.id), {
    archived: false, amzStatus: 'PLANNED', sarvaStatus: 'PLANNED',
  });
  await registerVrids(vrids, t.id, t.ownerUid ?? '');
  return null;
}
