/**
 * The client's own Amazon export template, reproduced exactly.
 *
 * Source of truth: "Export file Amazon.xlsx" (supplied 27 Jul 2026) — 67
 * columns, six stops, one row per VR ID. Their own sample proves the row rule:
 * three rows all carrying Tour ID T-29FPC0972 with different VR IDs.
 *
 * ⚠️ THE TEMPLATE IS IRREGULAR AND WE MATCH IT ANYWAY.
 * Every stop block is nine columns — name, yard arrival, POC arrival, POC
 * updated time, feedback, yard departure, POC departure, POC updated time,
 * feedback — EXCEPT stop 3, which stops after "Stop 3 Yard Departure" and is
 * three columns short. That is how their file is built, and emitting the
 * "correct" nine would shift columns 36-67 and silently file every later value
 * under the wrong heading when they paste into their workbook. Reproduce the
 * quirk; don't fix it. (Their 54-column operational sheet has the same kind of
 * gap around stop 4's KM column — see exportTourSheet.)
 *
 * Written as a real .xlsx via exceljs, not CSV, so dates land as datetimes
 * rather than text — their sample's date cells are real Excel dates and their
 * formulas depend on that. exceljs is ~1MB and dynamically imported, exactly
 * as the importer does it.
 *
 * The columns the client asked for on top of the template — created by/date/
 * time, updated by/date/time, status, manual KM and the rest — are appended
 * AFTER column 67, so the first 67 stay byte-identical to their layout and
 * anything they paste keeps working.
 */
import { legOps, legHistory, formatEvent, requestStatusLabel, type Tour, type TourLeg, type TourLegStop, type MoneyRequest } from './store.js';
import { brandSlug } from './brand.js';

/* ── helpers ────────────────────────────────────────────────────────────── */

/** A datetime-local string ("2026-07-28T19:30") → a real Date, or ''. */
function toDate(v?: string | number): Date | '' {
  if (v === undefined || v === null || v === '') return '';
  const d = typeof v === 'number' ? new Date(v) : new Date(v);
  return isNaN(d.getTime()) ? '' : d;
}

/** Numeric when it is a number, so their totals still work. */
function toNum(v?: string): number | string {
  if (!v || !String(v).trim()) return '';
  const n = Number(v);
  return Number.isFinite(n) ? n : String(v);
}

/**
 * When the POC actually recorded this stop event — the template's "Sarva POC
 * Updated Time". Taken from the audit trail so a later correction shows the
 * time it was corrected, not the time it claims the lorry moved. Falls back to
 * the stamp itself for runs that predate the trail.
 */
function pocUpdatedAt(t: Tour, vrid: string, stopName: string, kind: 'in' | 'out'): Date | '' {
  const action = kind === 'in' ? 'Checked in' : 'Checked out';
  const hit = [...legHistory(t, vrid)]
    .reverse()
    .find((e) => e.action === action && (e.detail ?? '').startsWith(stopName));
  return hit ? new Date(hit.atMs) : '';
}

type CellValue = string | number | Date | '';

/** One stop's slice of the row. `full` is false only for stop 3. */
function stopCells(t: Tour, leg: TourLeg, s: TourLegStop | undefined, full: boolean): CellValue[] {
  const name = s?.name ?? '';
  const arrivalPoc = s?.actualArrival ? new Date(s.actualArrival) : '';
  const departurePoc = s?.actualDeparture ? new Date(s.actualDeparture) : '';
  const head: CellValue[] = [
    name,
    toDate(s?.arrivalAt),                                   // Stop N Yard Arrival (planned)
    arrivalPoc,                                             // Arrival Time, per the POC
    name ? pocUpdatedAt(t, leg.vrid, name, 'in') : '',      // Sarva POC Updated Time
    s?.feedback ?? '',                                      // Feedback
    toDate(s?.departureAt),                                 // Stop N Yard Departure (planned)
  ];
  // Stop 3 ends here in their template.
  if (!full) return head;
  return [
    ...head,
    departurePoc,                                           // Departure Time, per the POC
    name ? pocUpdatedAt(t, leg.vrid, name, 'out') : '',      // Sarva POC Updated Time
    // Their sheet carries a second Feedback per stop; we hold one note per
    // stop, so it goes in the arrival column and this stays blank rather than
    // repeating the same text twice.
    '',
  ];
}

/* ── headers ────────────────────────────────────────────────────────────── */

const STOP_COUNT = 6;
/** Stop 3 is the short one — see the note at the top of this file. */
const isFullStop = (n: number) => n !== 3;

function stopHeaders(n: number): string[] {
  const head = [
    `Stop ${n}`,
    `Stop ${n} Yard Arrival`,
    `Stop ${n} Arrival Time,\nAccordingly, POC In Website`,
    'Sarva POC \nUpdated Time',
    'Feedback',
    `Stop ${n} Yard Departure`,
  ];
  if (!isFullStop(n)) return head;
  return [...head, `Stop ${n} Departure Time,\nAccordingly, POC In Website`, 'Sarva POC \nUpdated Time', 'Feedback'];
}

/** Columns 1-11, then the six stop blocks, then 63-67. Exactly their file. */
const TEMPLATE_HEADERS: string[] = [
  'Date', 'Tour ID', 'VR ID', 'Facility Sequence', 'Trip Type\nSCHEDULE\\ ADHOC',
  'Sarva Express\nEquipment Type', 'Amazon Relay\nEquipment Type',
  'Driver', 'Vehicle ID', 'Driver Number', "VENDOR'S NAME",
  ...Array.from({ length: STOP_COUNT }, (_, i) => stopHeaders(i + 1)).flat(),
  'Sarva Status', 'PRESENT / Absent', 'No Load\\ Load', 'Advance / \nAdhoc Amount', 'Paid / Pending',
];

/**
 * What the client asked for beyond the template. Appended after column 67 so
 * their existing layout is untouched.
 */
const EXTRA_HEADERS: string[] = [
  'VR ID no.', 'Sarva POC', 'Status', 'AMZ Status', 'Record state',
  'Created by', 'Created date', 'Created time',
  'Updated by', 'Updated date', 'Updated time',
  'Start KM', 'End KM', 'Manual KM', 'Amazon Relay KM', 'GPS KM', 'KM variance (GPS - Amazon)',
  'POD received', 'Invoice given',
  'KM photos', 'Invoice photos', 'GPS photos', 'POD photos',
  'Expense', 'Expense note', 'Remarks', 'Run feedback',
  'Delay reports', 'Revised ETA',
  'Diesel request', 'Diesel amount', 'Diesel UTR', 'G-pay name', 'G-pay number',
  'Shared with vendor', 'Shared with driver',
  'VR ID submitted at', 'Updates', 'First update', 'Last update', 'Full update history',
];

/* ── rows ───────────────────────────────────────────────────────────────── */

function templateRow(t: Tour, leg: TourLeg): CellValue[] {
  const stops = leg.stops ?? [];
  return [
    // Date is date-only in their sample — the service day, no time component.
    (() => { const d = toDate(t.serviceAt); return d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()) : (t.date || ''); })(),
    t.tourId,
    leg.vrid,
    stops.map((s) => s.name).filter(Boolean).join('->'),
    t.scheduleAdhoc,
    t.seEquipmentType || t.amzEquipmentType,
    t.amzEquipmentType,
    t.driver,
    t.vehicleId,
    toNum(t.driverNumber),
    t.vendorName,
    ...Array.from({ length: STOP_COUNT }, (_, i) => stopCells(t, leg, stops[i], isFullStop(i + 1))).flat(),
    t.sarvaStatus,
    legOps(t, (t.legs ?? []).indexOf(leg)).present ?? t.present,
    leg.loadType ?? t.noLoadLoad,
    toNum(t.advanceAmount),
    t.paidPending,
  ];
}

function extraRow(t: Tour, leg: TourLeg, index: number, total: number, lane: string, diesel?: MoneyRequest): CellValue[] {
  const o = legOps(t, index);
  const hist = legHistory(t, leg.vrid);
  const variance = (() => {
    const g = Number(o.gpsKm), a = Number(o.amazonRelyKm);
    return o.gpsKm && o.amazonRelyKm && Number.isFinite(g) && Number.isFinite(a) ? g - a : '';
  })();
  const reports = (t.reports ?? []).filter((r) => r.vrid === leg.vrid);
  const dt = (ms?: number) => (ms ? new Date(ms) : '');
  const dateOnly = (ms?: number) => { const d = dt(ms); return d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()) : ''; };
  const timeOnly = (ms?: number) => (ms ? new Date(ms).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }) : '');

  return [
    `${index + 1} of ${total}`,
    t.ownerName ?? '',
    lane,
    t.amzStatus,
    t.archived ? 'Cancelled' : t.draft ? 'Draft' : 'Live',
    t.createdByName ?? '', dateOnly(t.createdAtMs), timeOnly(t.createdAtMs),
    t.updatedByName ?? '', dateOnly(t.updatedAtMs), timeOnly(t.updatedAtMs),
    toNum(o.startKm), toNum(o.endKm), toNum(o.totalManualKm), toNum(o.amazonRelyKm), toNum(o.gpsKm), variance,
    o.podGiven ? 'Yes' : 'No', o.invoiceGiven ? 'Yes' : 'No',
    o.kmPhotos?.length ?? 0, o.invoicePhotos?.length ?? 0, o.gpsPhotos?.length ?? 0, o.podPhotos?.length ?? 0,
    toNum(o.expenseAmount), o.expenseNote ?? '', o.remarks ?? '', o.feedback ?? '',
    reports.map((r) => `${r.event}: ${r.reason}`).join(' | '),
    reports.map((r) => r.estimatedAt).filter(Boolean).join(' | '),
    diesel ? requestStatusLabel(diesel) : '',
    diesel?.amountPaise ? Math.round(diesel.amountPaise / 100) : '',
    diesel?.utr ?? '',
    t.gpayName ?? '', t.gpayNumber ?? '',
    t.sharedVendor ? 'Yes' : 'No', t.sharedDriver ? 'Yes' : 'No',
    dt(o.completedAtMs),
    hist.length,
    dt(hist[0]?.atMs),
    dt(hist[hist.length - 1]?.atMs),
    hist.map(formatEvent).join('\n'),
  ];
}

/** A legacy route with no legs still exports one row, off its flat VRIDs. */
function legsOf(t: Tour): TourLeg[] {
  if (t.legs?.length) return t.legs;
  const vrids = t.vrIds?.length ? t.vrIds : t.vrId ? [t.vrId] : [''];
  return vrids.map((vrid) => ({ vrid, stops: [] }));
}

export interface AmazonTemplateInput {
  tours: Tour[];
  requests?: MoneyRequest[];
  laneOf?: (t: Tour) => string;
  /** Filename stem. */
  name?: string;
}

/** Build the rows without writing a file — used by the tests. */
export function buildTemplateRows(input: AmazonTemplateInput): { headers: string[]; rows: CellValue[][] } {
  const rows: CellValue[][] = [];
  input.tours.forEach((t) => {
    const legs = legsOf(t);
    legs.forEach((leg, i) => {
      const lane = input.laneOf?.(t)
        ?? (t.amzStatus === 'COMPLETED' ? 'Completed' : t.amzStatus === 'IN PROGRESS' ? 'In Transit' : 'Upcoming');
      const diesel = input.requests?.find((q) => q.kind === 'diesel' && q.tourId === t.id);
      rows.push([...templateRow(t, leg), ...extraRow(t, leg, i, legs.length, lane, diesel)]);
    });
  });
  return { headers: [...TEMPLATE_HEADERS, ...EXTRA_HEADERS], rows };
}

/** How many columns their template occupies — everything after is ours. */
export const TEMPLATE_COLUMN_COUNT = TEMPLATE_HEADERS.length;

/**
 * Write the workbook and hand it to the browser. Real .xlsx with real date
 * cells, headers styled the way their file reads (bold, wrapped, centred).
 */
export async function exportAmazonTemplate(input: AmazonTemplateInput): Promise<number> {
  const { headers, rows } = buildTemplateRows(input);
  const ExcelJS = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Sarva Express';
  wb.created = new Date();
  const ws = wb.addWorksheet('Sheet1');

  ws.addRow(headers);
  rows.forEach((r) => ws.addRow(r));

  const header = ws.getRow(1);
  header.font = { bold: true };
  header.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
  header.height = 42;

  ws.columns.forEach((col, i) => {
    col.width = i < 11 ? 18 : 16;
    // Anything that carries a Date gets their readable format.
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      if (cell.value instanceof Date) {
        const dateOnly = i === 0 || headers[i]?.endsWith('date');
        cell.numFmt = dateOnly ? 'dd-mmm-yyyy' : 'dd-mmm-yyyy hh:mm';
      }
    });
  });
  // The history cell is long — keep it readable rather than a mile wide.
  const historyIdx = headers.indexOf('Full update history');
  if (historyIdx >= 0) {
    const c = ws.getColumn(historyIdx + 1);
    c.width = 60;
    c.alignment = { wrapText: true, vertical: 'top' };
  }
  ws.views = [{ state: 'frozen', ySplit: 1 }];

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${brandSlug}-${input.name ?? 'amazon-export'}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return rows.length;
}
