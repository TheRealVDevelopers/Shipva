/**
 * One board, two kinds of work.
 *
 * The client wants Amazon tours and ordinary trips in a single Upcoming list.
 * They're stored differently and should stay that way — a tour is VRID legs with
 * facility stops, a trip is an LR with pickup/drop points — so rather than
 * force one shape onto the other, both are projected into a read-only view model
 * here. The board renders BoardItems; writes still go to the real record.
 *
 * Keep this file free of UI. If a screen needs a field, add it to BoardItem and
 * map it from both sides, so neither kind can quietly drift out of the list.
 */
import type { Trip, TripStatus } from './mocks.js';
import type { Tour, TourLeg } from './store.js';

/** The three tabs. "All" is deliberately gone — the client asked for three. */
export type Lane = 'Upcoming' | 'In Transit' | 'Completed';

export interface BoardStop {
  name: string;
  mapUrl?: string | undefined;
  /** Planned times (datetime-local strings). */
  arrivalAt?: string | undefined;
  departureAt?: string | undefined;
  /** Actual check-in/out stamps (epoch ms). */
  actualArrival?: number | undefined;
  actualDeparture?: number | undefined;
}

/** A run on the board, whether it came from a tour or a trip. */
export interface BoardItem {
  kind: 'tour' | 'trip';
  id: string;
  /** Tour ID or LR — what the team calls it. */
  code: string;
  /** Every VRID on the run (a trip has at most its one auto VR ID). */
  vrids: string[];
  lane: Lane;
  /** Sort key — when the run starts. */
  startMs: number;
  dateLabel: string;
  driver: string;
  driverNumber: string;
  vehicle: string;
  vehicleType: string;
  /** Flattened stops, in order, across every leg. */
  stops: BoardStop[];
  /** Per-VRID grouping, so the detail view can show a run leg by leg. */
  legs: { vrid: string; loadType?: string | undefined; stops: BoardStop[] }[];
  distanceLabel: string;
  ownerUid: string;
  ownerName: string;
  /** The record behind it, for actions that need the real thing. */
  source: Tour | Trip;
}

const tourLane = (t: Tour): Lane =>
  t.amzStatus === 'COMPLETED' ? 'Completed' : t.amzStatus === 'IN PROGRESS' ? 'In Transit' : 'Upcoming';

/** Trips use their own six-state timeline; fold it into the three lanes. */
const tripLane = (s: TripStatus): Lane =>
  s === 'closed' ? 'Completed' : s === 'assigned' ? 'Upcoming' : 'In Transit';

const legsOf = (t: Tour): TourLeg[] => {
  if (t.legs?.length) return t.legs;
  const vrids = t.vrIds?.length ? t.vrIds : t.vrId ? [t.vrId] : [];
  return vrids.map((v) => ({ vrid: v, stops: [] }));
};

/** Best-effort start time: the service datetime, else the first planned arrival. */
function tourStart(t: Tour): number {
  const svc = t.serviceAt ? new Date(t.serviceAt).getTime() : NaN;
  if (!Number.isNaN(svc)) return svc;
  const first = legsOf(t).flatMap((l) => l.stops).find((s) => s.arrivalAt)?.arrivalAt;
  const a = first ? new Date(first).getTime() : NaN;
  return Number.isNaN(a) ? (t.createdAtMs ?? 0) : a;
}

export function fromTour(t: Tour): BoardItem {
  const legs = legsOf(t).map((l) => ({
    vrid: l.vrid,
    loadType: l.loadType,
    stops: l.stops.map((s): BoardStop => ({
      name: s.name, mapUrl: s.mapUrl,
      arrivalAt: s.arrivalAt, departureAt: s.departureAt,
      actualArrival: s.actualArrival, actualDeparture: s.actualDeparture,
    })),
  }));
  const km = t.totalManualKm || t.amazonRelyKm || '';
  return {
    kind: 'tour',
    id: t.id,
    code: t.tourId || t.vrId || '—',
    vrids: legs.map((l) => l.vrid).filter(Boolean),
    lane: tourLane(t),
    startMs: tourStart(t),
    dateLabel: t.date,
    driver: t.driver, driverNumber: t.driverNumber,
    vehicle: t.vehicleId, vehicleType: t.amzEquipmentType || '',
    stops: legs.flatMap((l) => l.stops),
    legs,
    distanceLabel: km ? `${km} km` : '',
    ownerUid: t.ownerUid ?? '', ownerName: t.ownerName ?? '',
    source: t,
  };
}

export function fromTrip(t: Trip): BoardItem {
  // A trip's points carry no times of their own — the trip has one date — so the
  // stops are named only. Showing invented per-stop times would be worse than
  // showing none.
  const stops: BoardStop[] = (t.points?.length ? t.points : [{ label: t.from }, { label: t.to }])
    .map((p) => ({ name: p.label, mapUrl: p.mapUrl }));
  const vrids = t.vrId ? [t.vrId] : [];
  return {
    kind: 'trip',
    id: t.id ?? '',
    code: t.lr,
    vrids,
    lane: tripLane(t.status),
    startMs: t.createdAtMs ?? 0,
    dateLabel: t.date,
    driver: t.driver, driverNumber: '',
    vehicle: t.vehicleReg, vehicleType: '',
    stops,
    legs: vrids.length ? [{ vrid: vrids[0]!, stops }] : [{ vrid: t.lr, stops }],
    distanceLabel: '',
    ownerUid: t.ownerUid ?? '', ownerName: t.ownerName ?? '',
    source: t,
  };
}

/** Both kinds, newest first, in one list. Cancelled/archived runs are kept in
 *  Firestore for the record but never appear on the board. */
export function buildBoard(tours: Tour[], trips: Trip[]): BoardItem[] {
  return [
    ...tours.filter((t) => !t.archived).map(fromTour),
    ...trips.filter((t) => !t.archived).map(fromTrip),
  ].sort((a, b) => b.startMs - a.startMs);
}

export const inLane = (i: BoardItem, lane: Lane): boolean => i.lane === lane;

/** Free-text search across the fields people actually search by. */
export function matches(i: BoardItem, q: string): boolean {
  if (!q.trim()) return true;
  const hay = `${i.code} ${i.vrids.join(' ')} ${i.driver} ${i.vehicle} ${i.vehicleType} ${i.ownerName} ${i.stops.map((s) => s.name).join(' ')}`;
  return hay.toLowerCase().includes(q.trim().toLowerCase());
}
