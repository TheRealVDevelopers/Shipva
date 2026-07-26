/**
 * Full Amazon-tour detail export — the client's point 5: "all trip details
 * except map data, including timings, vendor details, vehicle details, VRIDs,
 * status and operational information."
 *
 * One row per VRID (not per tour), because that's now the unit a POC updates:
 * two VRIDs on the same vehicle each carry their own KM, POD and photos. Map
 * links are deliberately excluded — they're long, unreadable in a spreadsheet
 * and the client asked for them out. Photos appear as a count plus a Yes/No,
 * not as URLs, for the same reason.
 *
 * Separate from exportTourSheet, which reproduces Amazon's own 54-column
 * operational template exactly and must not drift. This one is ours.
 */
import { legOps, type Tour, type TourLeg } from './store.js';
import { exportRows, type Cell } from './exportExcel.js';
import { brandSlug } from './brand.js';

/** "2026-07-15T01:00" → "15 Jul 2026, 01:00"; passes through anything odd. */
const dt = (v?: string): string => {
  if (!v) return '';
  const d = new Date(v);
  return isNaN(d.getTime()) ? v : d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  });
};
/** Epoch ms → the same readable stamp. */
const ms = (v?: number): string => (v ? dt(new Date(v).toISOString()) : '');
const yn = (b: boolean | undefined): string => (b ? 'Yes' : 'No');

const HEADERS = [
  'Service date', 'Service time', 'Tour ID', 'VRID', 'VRID no.', 'Trip type',
  'Vendor', 'Driver', 'Driver number', 'Vehicle', 'Vehicle type',
  'POC / handled by', 'AMZ status', 'Sarva status', 'Load type', 'Present/Absent',
  'Route', 'Stops',
  'Planned arrival (first)', 'Actual arrival (first)', 'Planned departure (last)', 'Actual departure (last)',
  'On time?', 'Delay reports',
  'Start KM', 'End KM', 'Manual KM', 'Amazon KM', 'GPS KM', 'KM variance (GPS − Amazon)',
  'POD received', 'Invoice given', 'Expense (₹)', 'Expense note',
  'Remarks', 'Feedback', 'Stop feedback',
  'KM photos', 'Invoice photos', 'GPS photos', 'POD photos',
  'Advance amount', 'Paid/Pending', 'G-pay name', 'G-pay number',
  'Shared with vendor', 'Shared with driver',
  'VRID updated at', 'Record state',
];

function rowFor(t: Tour, leg: TourLeg, i: number, total: number): Cell[] {
  const o = legOps(t, i);
  const stops = leg.stops ?? [];
  const first = stops[0];
  const last = stops[stops.length - 1];
  const late = !!(first?.actualArrival && first.arrivalAt && first.actualArrival > new Date(first.arrivalAt).getTime());
  const reports = (t.reports ?? []).filter((r) => r.vrid === leg.vrid);
  const num = (v?: string) => (v && v.trim() && Number.isFinite(Number(v)) ? Number(v) : '');
  const variance = (() => {
    const g = Number(o.gpsKm), a = Number(o.amazonRelyKm);
    return Number.isFinite(g) && Number.isFinite(a) && o.gpsKm && o.amazonRelyKm ? g - a : '';
  })();

  return [
    t.serviceAt ? t.serviceAt.slice(0, 10) : t.date,
    t.serviceAt ? t.serviceAt.slice(11, 16) : '',
    t.tourId, leg.vrid, `${i + 1} of ${total}`, t.scheduleAdhoc,
    t.vendorName, t.driver, t.driverNumber, t.vehicleId, t.amzEquipmentType,
    t.ownerName ?? '', t.amzStatus, t.sarvaStatus, leg.loadType ?? 'Load', o.present ?? '',
    stops.map((s) => s.name).filter(Boolean).join(' -> '), stops.length,
    dt(first?.arrivalAt), ms(first?.actualArrival), dt(last?.departureAt), ms(last?.actualDeparture),
    first?.actualArrival ? (late ? 'Late' : 'On time') : '',
    reports.map((r) => `${r.event}: ${r.reason}`).join(' | '),
    num(o.startKm), num(o.endKm), num(o.totalManualKm), num(o.amazonRelyKm), num(o.gpsKm), variance,
    yn(o.podGiven), yn(o.invoiceGiven), num(o.expenseAmount), o.expenseNote ?? '',
    o.remarks ?? '', o.feedback ?? '',
    stops.map((s) => s.feedback).filter(Boolean).join(' | '),
    o.kmPhotos?.length ?? 0, o.invoicePhotos?.length ?? 0, o.gpsPhotos?.length ?? 0, o.podPhotos?.length ?? 0,
    num(t.advanceAmount), t.paidPending, t.gpayName ?? '', t.gpayNumber ?? '',
    yn(t.sharedVendor), yn(t.sharedDriver),
    ms(o.completedAtMs),
    t.archived ? 'Cancelled' : t.draft ? 'Draft' : 'Live',
  ];
}

/** Every VRID across the given tours, one row each. */
export function exportTourDetail(tours: Tour[]): void {
  const rows: Cell[][] = [];
  tours.forEach((t) => {
    const legs = t.legs?.length
      ? t.legs
      // A legacy route with no legs still exports one row, off its flat VRIDs.
      : [{ vrid: (t.vrIds?.[0] ?? t.vrId ?? ''), stops: [] } as TourLeg];
    legs.forEach((leg, i) => rows.push(rowFor(t, leg, i, legs.length)));
  });
  exportRows(`${brandSlug}-amazon-tours-${new Date().toISOString().slice(0, 10)}`, HEADERS, rows);
}
