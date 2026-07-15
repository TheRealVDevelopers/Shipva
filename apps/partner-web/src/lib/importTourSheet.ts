/**
 * Import the client's "EXL Update" tour sheet back into the app.
 *
 * Their ops team lives in that spreadsheet, so this lets it feed the app rather
 * than everything being retyped. Rows are matched on Tour ID (falling back to
 * the VR ID) — a known tour is updated, an unknown one is created.
 *
 * Columns are located by header text, not position, so a sheet with an extra
 * column or a reordered block still imports. The layout is verified against
 * their real file: 54 columns, stops 1–3 each ending with KM, stop 4 without.
 *
 * exceljs is ~1MB and is only needed by whoever actually opens the importer, so
 * it's pulled in with a dynamic import(). Vite code-splits it out of the main
 * bundle automatically — don't turn this into a static import.
 */
import type { Tour, TourStop } from './store.js';

export interface ParsedRow {
  row: number;
  tour: Omit<Tour, 'id'>;
  /** Non-fatal notes — the row still imports. */
  warnings: string[];
}
export interface ParseResult {
  rows: ParsedRow[];
  /** Rows that couldn't be read at all, with the reason. */
  errors: { row: number; reason: string }[];
  /** Headers we didn't recognise — surfaced so a changed sheet is obvious. */
  unknownHeaders: string[];
}

const norm = (s: unknown): string => String(s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const p2 = (n: number) => String(n).padStart(2, '0');

/**
 * Excel stores a datetime as a serial number with no timezone, and exceljs
 * decodes it into a JS Date at UTC. The sheet means wall-clock time — a facility
 * arrival typed as 00:00 IS 00:00 — so these must be read back with the UTC
 * getters. Formatting them locally shifts every time by the machine's offset
 * (+5:30 here), which would silently move Amazon arrival/departure stamps that
 * the billing is reconciled against.
 */
const fmtDateTime = (d: Date): string =>
  `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}, ${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}`;
const fmtDate = (d: Date): string =>
  `${p2(d.getUTCDate())} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;

/** Cell → plain string. Dates keep the sheet's own "12 Jul, 14:30" shape. */
function cellText(v: unknown): string {
  if (v == null) return '';
  if (v instanceof Date) return fmtDateTime(v);
  if (typeof v === 'object') {
    const o = v as { text?: string; result?: unknown; richText?: { text: string }[] };
    if (Array.isArray(o.richText)) return o.richText.map((r) => r.text).join('');
    if (o.text != null) return String(o.text);
    if (o.result != null) return String(o.result);
    return '';
  }
  return String(v).trim();
}

/** Date cell → the sheet's date column, as a readable label (UTC parts — see above). */
function dateText(v: unknown): string {
  if (v instanceof Date) return fmtDate(v);
  return cellText(v);
}

const yesNo = (s: string): boolean => /^(y|yes|true|1)$/i.test(s.trim());

/** The 19 leading columns, keyed by their header in the client's sheet. */
const FIELD_BY_HEADER: Record<string, keyof Omit<Tour, 'id' | 'stops'>> = {
  'date': 'date',
  'tour id': 'tourId',
  'vr id': 'vrId',
  'se tracker in this line': 'seTracker',
  'toll': 'toll',
  'amz equipment type': 'amzEquipmentType',
  'se equipment type': 'seEquipmentType',
  'amz status': 'amzStatus',
  'sarva status': 'sarvaStatus',
  'present / absent': 'present',
  'schedule\\ adhoc': 'scheduleAdhoc',
  'no load\\ load': 'noLoadLoad',
  'advance / adhoc amount': 'advanceAmount',
  'paid / pending': 'paidPending',
  'driver': 'driver',
  'vehicle id': 'vehicleId',
  'driver number': 'driverNumber',
  "vendor's name": 'vendorName',
  'total vehicle manual km': 'totalManualKm',
  'amazon rely km': 'amazonRelyKm',
  'gps km': 'gpsKm',
  'remarks': 'remarks',
};

const KNOWN_STOP_HEADERS = ['km photo yes/no', 'arrival report', 'invoice photo yes/no', 'dispatch report', 'km', 'facility sequence'];

const blankTour = (): Omit<Tour, 'id'> => ({
  date: '', tourId: '', vrId: '', seTracker: '', toll: '',
  amzEquipmentType: '', seEquipmentType: '', amzStatus: '', sarvaStatus: '',
  present: '', scheduleAdhoc: '', noLoadLoad: '', advanceAmount: '', paidPending: '',
  driver: '', vehicleId: '', driverNumber: '', vendorName: '',
  stops: [], totalManualKm: '', amazonRelyKm: '', gpsKm: '', remarks: '',
});

/**
 * Parse an "EXL Update"-shaped workbook. Reads the first worksheet, treats row
 * 1 as headers and everything below as tours.
 */
export async function parseTourSheet(file: File): Promise<ParseResult> {
  const ExcelJS = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await file.arrayBuffer());
  const ws = wb.worksheets[0];
  if (!ws) return { rows: [], errors: [{ row: 0, reason: 'The workbook has no sheets.' }], unknownHeaders: [] };

  // Header row → column index.
  const headers: { col: number; label: string }[] = [];
  ws.getRow(1).eachCell({ includeEmpty: false }, (cell, col) => {
    const label = norm(cellText(cell.value));
    if (label) headers.push({ col, label });
  });
  if (headers.length === 0) {
    return { rows: [], errors: [{ row: 1, reason: 'No header row found.' }], unknownHeaders: [] };
  }

  // Stop blocks: every "Stop N" header opens a block that runs to the next one.
  const stopStarts = headers.filter((h) => /^stop \d+$/.test(h.label));
  const unknown = headers
    .filter((h) => !FIELD_BY_HEADER[h.label] && !/^stop \d+/.test(h.label) && !KNOWN_STOP_HEADERS.includes(h.label))
    .map((h) => h.label);

  const rows: ParsedRow[] = [];
  const errors: { row: number; reason: string }[] = [];

  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const get = (col: number) => cellText(row.getCell(col).value);
    const hasAny = headers.some((h) => get(h.col) !== '');
    if (!hasAny) continue; // blank spacer row

    const t = blankTour();
    const warnings: string[] = [];

    for (const h of headers) {
      const field = FIELD_BY_HEADER[h.label];
      if (!field) continue;
      const raw = row.getCell(h.col).value;
      (t[field] as string) = h.label === 'date' ? dateText(raw) : cellText(raw);
    }

    // Stops — read each "Stop N" block by offset from its own header.
    const stops: TourStop[] = [];
    for (let i = 0; i < stopStarts.length; i++) {
      const start = stopStarts[i]!.col;
      const at = (offset: number) => get(start + offset);
      const name = at(0);
      if (!name) continue;
      stops.push({
        name,
        amzArrival: at(1),
        kmPhoto: yesNo(at(2)),
        arrivalReport: at(3),
        amzDeparture: at(4),
        invoicePhoto: yesNo(at(5)),
        dispatchReport: at(6),
        // Stop 4 has no KM column in their sheet — guard rather than read the
        // next block's "Stop N" name into it.
        km: /^\d+(\.\d+)?$/.test(at(7)) ? at(7) : '',
      });
    }
    t.stops = stops;

    if (t.vrId) t.vrIds = t.vrId.split(/[,/]/).map((v) => v.trim()).filter(Boolean);
    if (!t.tourId && !t.vrId) {
      errors.push({ row: r, reason: 'No Tour ID and no VR ID — nothing to match on.' });
      continue;
    }
    if (!t.date) warnings.push('No date');
    if (stops.length === 0) warnings.push('No stops');

    rows.push({ row: r, tour: t, warnings });
  }

  return { rows, errors, unknownHeaders: [...new Set(unknown)] };
}

/** Match an incoming row to an existing tour: Tour ID first, then any VR ID. */
export function matchExisting(incoming: Omit<Tour, 'id'>, existing: Tour[]): Tour | null {
  const byTourId = incoming.tourId.trim()
    ? existing.find((t) => t.tourId.trim() && t.tourId.trim().toLowerCase() === incoming.tourId.trim().toLowerCase())
    : undefined;
  if (byTourId) return byTourId;
  const vrids = (incoming.vrIds ?? [incoming.vrId]).map((v) => v.trim().toLowerCase()).filter(Boolean);
  if (vrids.length === 0) return null;
  return existing.find((t) => {
    const theirs = (t.vrIds ?? [t.vrId]).map((v) => v.trim().toLowerCase()).filter(Boolean);
    return theirs.some((v) => vrids.includes(v));
  }) ?? null;
}
