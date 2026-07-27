/**
 * The run export — one sheet, used by BOTH the Trips board and Amazon Tours so
 * the two modules can never drift apart.
 *
 * The client's rules for it:
 *  • One row per VR ID. A trip carrying three VRIDs is three rows, each with
 *    the full detail — not one row with the VRIDs jammed into a cell.
 *  • The **full update history**, not just the latest values. Every row carries
 *    a complete update log, and there is a second export with one row per
 *    individual update for when the log column isn't enough.
 *  • Created by / created date & time, updated by / updated date & time,
 *    status, manual kilometres, and the rest of the operational columns.
 *
 * NOTE ON COLUMN ORDER: no sample trip sheet has ever been supplied. The order
 * below is the client's own list, grouped the way their Amazon sheet groups it
 * (identity → people → schedule → operations → money → audit). It is a single
 * array — when the sample arrives, reorder COLUMNS and nothing else changes.
 */
import { legOps, legHistory, formatEvent, type Tour, type TourLeg, type TourEvent } from './store.js';
import { exportRows, type Cell } from './exportExcel.js';
import { brandSlug } from './brand.js';
import type { Trip } from './mocks.js';
import { requestStatusLabel, type MoneyRequest } from './store.js';

/* ── formatting ─────────────────────────────────────────────────────────── */

const DATE_OPTS: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
const TIME_OPTS: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: false };

/** Epoch ms → "26 Jul 2026". Date and time are separate columns so the sheet
 *  can be sorted and filtered on either. */
const dateOf = (ms?: number): string => (ms ? new Date(ms).toLocaleDateString('en-IN', DATE_OPTS) : '');
const timeOf = (ms?: number): string => (ms ? new Date(ms).toLocaleTimeString('en-IN', TIME_OPTS) : '');
/** A datetime-local string ("2026-07-28T19:30") → the same pair. */
const planDate = (v?: string): string => {
  if (!v) return '';
  const d = new Date(v);
  return isNaN(d.getTime()) ? v : d.toLocaleDateString('en-IN', DATE_OPTS);
};
const planTime = (v?: string): string => {
  if (!v) return '';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '' : d.toLocaleTimeString('en-IN', TIME_OPTS);
};
const yn = (b: unknown): string => (b ? 'Yes' : 'No');
/** Numeric when it is a number, so Excel can total the column. */
const num = (v?: string | number): Cell => {
  if (v === undefined || v === null || String(v).trim() === '') return '';
  const n = Number(v);
  return Number.isFinite(n) ? n : String(v);
};

/* ── the row ────────────────────────────────────────────────────────────── */

/** Everything one VRID's row needs, gathered before the columns read it. */
interface RunRow {
  tour: Tour;
  leg: TourLeg;
  index: number;
  total: number;
  /** The lane the board shows it in — Upcoming / In Transit / Completed. */
  lane: string;
  diesel?: MoneyRequest | undefined;
}

interface Col { label: string; get: (r: RunRow) => Cell }

const COLUMNS: Col[] = [
  // ── identity ──
  { label: 'Type', get: () => 'Amazon tour' },
  { label: 'Trip ID', get: (r) => r.tour.tourId },
  { label: 'VR ID', get: (r) => r.leg.vrid },
  { label: 'VR ID no.', get: (r) => `${r.index + 1} of ${r.total}` },
  { label: 'Trip type', get: (r) => r.tour.scheduleAdhoc },
  { label: 'Status', get: (r) => r.lane },
  { label: 'AMZ status', get: (r) => r.tour.amzStatus },
  { label: 'Sarva status', get: (r) => r.tour.sarvaStatus },
  { label: 'Record state', get: (r) => (r.tour.archived ? 'Cancelled' : r.tour.draft ? 'Draft' : 'Live') },

  // ── people & vehicle ──
  { label: 'Vendor', get: (r) => r.tour.vendorName },
  { label: 'Driver', get: (r) => r.tour.driver },
  { label: 'Driver number', get: (r) => r.tour.driverNumber },
  { label: 'Vehicle', get: (r) => r.tour.vehicleId },
  { label: 'Vehicle type', get: (r) => r.tour.amzEquipmentType },
  { label: 'POC / handled by', get: (r) => r.tour.ownerName ?? '' },

  // ── schedule ──
  { label: 'Service date', get: (r) => planDate(r.tour.serviceAt) || r.tour.date },
  { label: 'Service time', get: (r) => planTime(r.tour.serviceAt) },
  { label: 'Route', get: (r) => r.leg.stops.map((s) => s.name).filter(Boolean).join(' -> ') },
  { label: 'Stops', get: (r) => r.leg.stops.length },
  { label: 'Planned arrival', get: (r) => `${planDate(r.leg.stops[0]?.arrivalAt)} ${planTime(r.leg.stops[0]?.arrivalAt)}`.trim() },
  { label: 'Actual arrival', get: (r) => `${dateOf(r.leg.stops[0]?.actualArrival)} ${timeOf(r.leg.stops[0]?.actualArrival)}`.trim() },
  { label: 'Planned departure', get: (r) => { const s = r.leg.stops[r.leg.stops.length - 1]; return `${planDate(s?.departureAt)} ${planTime(s?.departureAt)}`.trim(); } },
  { label: 'Actual departure', get: (r) => { const s = r.leg.stops[r.leg.stops.length - 1]; return `${dateOf(s?.actualDeparture)} ${timeOf(s?.actualDeparture)}`.trim(); } },
  {
    label: 'On time?',
    get: (r) => {
      const s = r.leg.stops[0];
      if (!s?.actualArrival) return '';
      return s.arrivalAt && s.actualArrival > new Date(s.arrivalAt).getTime() ? 'Late' : 'On time';
    },
  },
  { label: 'Delay reports', get: (r) => (r.tour.reports ?? []).filter((x) => x.vrid === r.leg.vrid).map((x) => `${x.event}: ${x.reason}`).join(' | ') },
  { label: 'Revised ETA', get: (r) => (r.tour.reports ?? []).filter((x) => x.vrid === r.leg.vrid).map((x) => x.estimatedAt).filter(Boolean).join(' | ') },

  // ── operations ──
  { label: 'Load type', get: (r) => r.leg.loadType ?? 'Load' },
  { label: 'Present / Absent', get: (r) => legOps(r.tour, r.index).present ?? '' },
  { label: 'Start KM', get: (r) => num(legOps(r.tour, r.index).startKm) },
  { label: 'End KM', get: (r) => num(legOps(r.tour, r.index).endKm) },
  { label: 'Manual KM', get: (r) => num(legOps(r.tour, r.index).totalManualKm) },
  { label: 'Amazon KM', get: (r) => num(legOps(r.tour, r.index).amazonRelyKm) },
  { label: 'GPS KM', get: (r) => num(legOps(r.tour, r.index).gpsKm) },
  {
    label: 'KM variance (GPS - Amazon)',
    get: (r) => {
      const o = legOps(r.tour, r.index);
      const g = Number(o.gpsKm), a = Number(o.amazonRelyKm);
      return o.gpsKm && o.amazonRelyKm && Number.isFinite(g) && Number.isFinite(a) ? g - a : '';
    },
  },
  { label: 'POD received', get: (r) => yn(legOps(r.tour, r.index).podGiven) },
  { label: 'Invoice given', get: (r) => yn(legOps(r.tour, r.index).invoiceGiven) },
  { label: 'Expense', get: (r) => num(legOps(r.tour, r.index).expenseAmount) },
  { label: 'Expense note', get: (r) => legOps(r.tour, r.index).expenseNote ?? '' },
  { label: 'Remarks', get: (r) => legOps(r.tour, r.index).remarks ?? '' },
  { label: 'Feedback', get: (r) => legOps(r.tour, r.index).feedback ?? '' },
  { label: 'Stop feedback', get: (r) => r.leg.stops.map((s) => s.feedback).filter(Boolean).join(' | ') },
  { label: 'KM photos', get: (r) => legOps(r.tour, r.index).kmPhotos?.length ?? 0 },
  { label: 'Invoice photos', get: (r) => legOps(r.tour, r.index).invoicePhotos?.length ?? 0 },
  { label: 'GPS photos', get: (r) => legOps(r.tour, r.index).gpsPhotos?.length ?? 0 },
  { label: 'POD photos', get: (r) => legOps(r.tour, r.index).podPhotos?.length ?? 0 },

  // ── money ──
  { label: 'Advance amount', get: (r) => num(r.tour.advanceAmount) },
  { label: 'Paid / Pending', get: (r) => r.tour.paidPending },
  { label: 'Diesel request', get: (r) => (r.diesel ? requestStatusLabel(r.diesel) : '') },
  { label: 'Diesel amount', get: (r) => (r.diesel?.amountPaise ? Math.round(r.diesel.amountPaise / 100) : '') },
  { label: 'Diesel UTR', get: (r) => r.diesel?.utr ?? '' },
  { label: 'G-pay name', get: (r) => r.tour.gpayName ?? '' },
  { label: 'G-pay number', get: (r) => r.tour.gpayNumber ?? '' },
  { label: 'Shared with vendor', get: (r) => yn(r.tour.sharedVendor) },
  { label: 'Shared with driver', get: (r) => yn(r.tour.sharedDriver) },

  // ── audit ──
  { label: 'Created by', get: (r) => r.tour.createdByName ?? '' },
  { label: 'Created date', get: (r) => dateOf(r.tour.createdAtMs) },
  { label: 'Created time', get: (r) => timeOf(r.tour.createdAtMs) },
  { label: 'Updated by', get: (r) => r.tour.updatedByName ?? '' },
  { label: 'Updated date', get: (r) => dateOf(r.tour.updatedAtMs) },
  { label: 'Updated time', get: (r) => timeOf(r.tour.updatedAtMs) },
  { label: 'VR ID submitted at', get: (r) => { const c = legOps(r.tour, r.index).completedAtMs; return `${dateOf(c)} ${timeOf(c)}`.trim(); } },
  { label: 'Updates', get: (r) => legHistory(r.tour, r.leg.vrid).length },
  { label: 'First update', get: (r) => { const h = legHistory(r.tour, r.leg.vrid)[0]; return h ? `${dateOf(h.atMs)} ${timeOf(h.atMs)}` : ''; } },
  { label: 'Last update', get: (r) => { const h = legHistory(r.tour, r.leg.vrid).slice(-1)[0]; return h ? `${dateOf(h.atMs)} ${timeOf(h.atMs)}` : ''; } },
  // The whole trail in one cell — "full update history, not just the latest".
  { label: 'Full update history', get: (r) => legHistory(r.tour, r.leg.vrid).map(formatEvent).join('\n') },
];

/* ── building the rows ──────────────────────────────────────────────────── */

/** A legacy route with no legs still exports one row, off its flat VRIDs. */
function legsOf(t: Tour): TourLeg[] {
  if (t.legs?.length) return t.legs;
  const vrids = t.vrIds?.length ? t.vrIds : t.vrId ? [t.vrId] : [''];
  return vrids.map((vrid) => ({ vrid, stops: [] }));
}

export interface RunExportInput {
  tours: Tour[];
  /** Ordinary (non-Amazon) trips on the board, exported alongside. */
  trips?: Trip[];
  requests?: MoneyRequest[];
  /** The board lane per run, keyed by tour id — the Trips page knows it. */
  laneOf?: (t: Tour) => string;
  /** Filename stem, e.g. "trips-in-transit". */
  name: string;
}

function rowsFor(input: RunExportInput): { rows: Cell[][]; count: number } {
  const rows: Cell[][] = [];
  input.tours.forEach((t) => {
    const legs = legsOf(t);
    legs.forEach((leg, index) => {
      const r: RunRow = {
        tour: t, leg, index, total: legs.length,
        lane: input.laneOf?.(t) ?? (t.amzStatus === 'COMPLETED' ? 'Completed' : t.amzStatus === 'IN PROGRESS' ? 'In Transit' : 'Upcoming'),
        diesel: input.requests?.find((q) => q.kind === 'diesel' && q.tourId === t.id),
      };
      rows.push(COLUMNS.map((c) => c.get(r)));
    });
  });
  return { rows, count: rows.length };
}

/** The main sheet: one row per VR ID, every column, full history in a cell. */
export function exportRuns(input: RunExportInput): number {
  const { rows, count } = rowsFor(input);
  // Ordinary trips have no VRIDs; they're one row each, mapped onto the same
  // columns so a mixed board still produces one sheet rather than two.
  (input.trips ?? []).forEach((tp) => {
    const shim: Tour = {
      id: tp.id ?? '', date: tp.date, tourId: tp.lr, vrId: '', seTracker: '', toll: '',
      amzEquipmentType: '', seEquipmentType: '',
      amzStatus: tp.status === 'closed' ? 'COMPLETED' : 'IN PROGRESS',
      sarvaStatus: tp.status, present: '', scheduleAdhoc: 'TRIP', noLoadLoad: '',
      advanceAmount: '', paidPending: '', driver: tp.driver, vehicleId: tp.vehicleReg,
      driverNumber: '', vendorName: tp.customer ?? '', stops: [],
      totalManualKm: '', amazonRelyKm: '', gpsKm: '', remarks: tp.remark ?? '',
      ...(tp.ownerName ? { ownerName: tp.ownerName } : {}),
      ...(tp.createdAtMs ? { createdAtMs: tp.createdAtMs } : {}),
      ...(tp.reports ? { reports: tp.reports } : {}),
      ...(tp.archived ? { archived: tp.archived } : {}),
    };
    const leg: TourLeg = { vrid: '', stops: [] };
    rows.push(COLUMNS.map((c) => c.get({
      tour: shim, leg, index: 0, total: 1,
      lane: tp.status === 'closed' ? 'Completed' : 'In Transit',
    })).map((cell, i) => (COLUMNS[i]!.label === 'Type' ? 'Trip' : cell)));
  });
  exportRows(`${brandSlug}-${input.name}-${new Date().toISOString().slice(0, 10)}`,
    COLUMNS.map((c) => c.label), rows);
  return count + (input.trips?.length ?? 0);
}

/**
 * The companion sheet: one row per individual update, oldest first.
 *
 * The main export carries the whole trail in a single cell, which is right for
 * reading a run at a glance but poor for filtering. This is the same data one
 * event per row, so the client can pivot on who changed what and when.
 */
export function exportRunHistory(input: RunExportInput): number {
  const rows: Cell[][] = [];
  input.tours.forEach((t) => {
    const legs = legsOf(t);
    const seen = new Set<TourEvent>();
    legs.forEach((leg) => {
      legHistory(t, leg.vrid).forEach((e) => {
        // A route-wide event (no VRID) belongs to every leg — list it once
        // against the route rather than repeating it per VRID.
        if (!e.vrid) { if (seen.has(e)) return; seen.add(e); }
        rows.push([
          t.tourId, e.vrid || '(whole route)', t.vendorName, t.vehicleId, t.driver,
          dateOf(e.atMs), timeOf(e.atMs), e.by, e.action, e.detail ?? '',
        ]);
      });
    });
  });
  rows.sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  exportRows(`${brandSlug}-${input.name}-update-history-${new Date().toISOString().slice(0, 10)}`,
    ['Trip ID', 'VR ID', 'Vendor', 'Vehicle', 'Driver', 'Date', 'Time', 'Updated by', 'Action', 'What changed'],
    rows);
  return rows.length;
}
