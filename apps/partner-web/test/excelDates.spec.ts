/**
 * "Exported data: dates are not displaying correctly, and stop arrival and
 * departure times aren't being captured properly."
 *
 * Excel stores a date/time as a bare serial number with no timezone, and
 * exceljs writes a JS Date by its UTC fields. The exporter handed it local-time
 * Dates, so in India every time landed 5h30m early and every date-only cell
 * landed on the previous day. These build a REAL workbook, load it back the way
 * Excel reads it (the serial is the wall-clock) and check what a person sees.
 *
 * Time zone is forced to India so this reproduces on any machine, including CI.
 */
const ORIGINAL_TZ = process.env.TZ;
process.env.TZ = 'Asia/Kolkata';

import { describe, it, expect, vi, afterAll } from 'vitest';

vi.mock('../src/lib/brand.js', () => ({ brandSlug: 'sarva' }));

const { buildTemplateWorkbook, buildTemplateRows, excelWallClock, TEMPLATE_COLUMN_COUNT } =
  await import('../src/lib/exportAmazonTemplate.js');
const ExcelJS = (await import('exceljs')).default;
type Tour = Parameters<typeof buildTemplateRows>[0]['tours'][number];

afterAll(() => {
  if (ORIGINAL_TZ === undefined) delete process.env.TZ; else process.env.TZ = ORIGINAL_TZ;
});

const p2 = (n: number) => String(n).padStart(2, '0');
/** What Excel displays for a serial: the UTC fields of the decoded Date. */
const shown = (d: unknown) => {
  const x = d as Date;
  return `${x.getUTCFullYear()}-${p2(x.getUTCMonth() + 1)}-${p2(x.getUTCDate())} ${p2(x.getUTCHours())}:${p2(x.getUTCMinutes())}`;
};
const local = (d: number, h: number, mi: number) => new Date(2026, 7, d, h, mi).getTime();

/** Entries as the app writes them: same click as the stamp, a few ms later. */
const ev = (action: 'Checked in' | 'Checked out', name: string, at: number) => ({
  atMs: at + 40, by: 'POC', vrid: '112QM99ZW', action,
  detail: `${name} at ${p2(new Date(at).getHours())}:${p2(new Date(at).getMinutes())}`,
});

// HKR2 -> TBI1 -> TBI1 -> HKR2: the client's usual shape, with repeated names.
const stops = [
  { name: 'HKR2', arrivalAt: '2026-08-12T14:00', departureAt: '2026-08-12T15:00', actualArrival: local(12, 14, 5), actualDeparture: local(12, 15, 10) },
  { name: 'TBI1', arrivalAt: '2026-08-12T16:00', departureAt: '2026-08-12T16:30', actualArrival: local(12, 16, 2), actualDeparture: local(12, 16, 40) },
  { name: 'TBI1', arrivalAt: '2026-08-12T17:00', departureAt: '2026-08-12T17:30', actualArrival: local(12, 17, 3), actualDeparture: local(12, 17, 45) },
  { name: 'HKR2', arrivalAt: '2026-08-12T19:30', departureAt: '2026-08-12T20:00', actualArrival: local(12, 19, 40), actualDeparture: local(12, 20, 5) },
];

const base = {
  id: 'T1', date: '12 Aug 2026', tourId: 'T-34FPN2436', vrId: '', seTracker: '', toll: '',
  amzEquipmentType: '10 Truck', seEquipmentType: '10 Truck',
  amzStatus: 'COMPLETED', sarvaStatus: 'COMPLETED', present: 'PRESENT',
  scheduleAdhoc: 'SCHEDULE', noLoadLoad: 'load', advanceAmount: '0', paidPending: 'paid',
  driver: 'D', vehicleId: 'TN12BA0985', driverNumber: '9000000000', vendorName: 'V', stops: [],
  totalManualKm: '', amazonRelyKm: '', gpsKm: '', remarks: '',
  serviceAt: '2026-08-12T14:00',
  createdByName: 'Owner', createdAtMs: local(12, 13, 0), updatedByName: 'POC', updatedAtMs: local(12, 20, 6),
  legs: [{ vrid: '112QM99ZW', loadType: 'Load', stops }],
  history: stops.flatMap((s) => [ev('Checked in', s.name, s.actualArrival), ev('Checked out', s.name, s.actualDeparture)]),
} as unknown as Tour;

async function readBack(tours: Tour[]) {
  const { wb } = await buildTemplateWorkbook({ tours });
  const buf = await wb.xlsx.writeBuffer();
  const wb2 = new ExcelJS.Workbook();
  await wb2.xlsx.load(buf as ArrayBuffer);
  const ws = wb2.getWorksheet('Sheet1')!;
  const { headers } = buildTemplateRows({ tours });
  const cell = (label: string) => ws.getRow(2).getCell(headers.indexOf(label) + 1).value;
  return { cell, headers };
}

describe('why excelWallClock exists', () => {
  it('exceljs writes a Date by its UTC fields, so a raw local Date comes out shifted', async () => {
    // If exceljs ever starts honouring local time, this fails -- and excelWallClock
    // would then DOUBLE-shift, so it must be removed at the same time.
    const wb = new ExcelJS.Workbook();
    wb.addWorksheet('S').addRow([new Date(2026, 7, 12, 19, 30)]);
    const wb2 = new ExcelJS.Workbook();
    await wb2.xlsx.load((await wb.xlsx.writeBuffer()) as ArrayBuffer);
    expect(shown(wb2.getWorksheet('S')!.getRow(1).getCell(1).value)).toBe('2026-08-12 14:00');
  });

  it('excelWallClock carries the local wall-clock in the UTC fields', () => {
    const w = excelWallClock(new Date(2026, 7, 12, 19, 30));
    expect([w.getUTCFullYear(), w.getUTCMonth(), w.getUTCDate(), w.getUTCHours(), w.getUTCMinutes()]).toEqual([2026, 7, 12, 19, 30]);
  });
});

describe('what a person sees in the exported workbook', () => {
  it('shows the service day on the right day, not the day before', async () => {
    const { cell } = await readBack([base]);
    expect(shown(cell('Date'))).toBe('2026-08-12 00:00');
  });

  it('shows planned stop times as planned', async () => {
    const { cell } = await readBack([base]);
    expect(shown(cell('Stop 1 Yard Arrival'))).toBe('2026-08-12 14:00');
    expect(shown(cell('Stop 1 Yard Departure'))).toBe('2026-08-12 15:00');
    expect(shown(cell('Stop 4 Yard Arrival'))).toBe('2026-08-12 19:30');
  });

  it('shows the POC arrival and departure times the POC actually stamped', async () => {
    const { cell } = await readBack([base]);
    const arr = (n: number) => `Stop ${n} Arrival Time,\nAccordingly, POC In Website`;
    const dep = (n: number) => `Stop ${n} Departure Time,\nAccordingly, POC In Website`;
    expect(shown(cell(arr(1)))).toBe('2026-08-12 14:05');
    expect(shown(cell(dep(1)))).toBe('2026-08-12 15:10');
    expect(shown(cell(arr(4)))).toBe('2026-08-12 19:40');
    expect(shown(cell(dep(4)))).toBe('2026-08-12 20:05');
  });

  it('shows created and updated dates on the right day', async () => {
    const { cell } = await readBack([base]);
    expect(shown(cell('Created date'))).toBe('2026-08-12 00:00');
    expect(shown(cell('Updated date'))).toBe('2026-08-12 00:00');
  });
});

describe('Sarva POC Updated Time', () => {
  const pocUpdated = (r: ReturnType<typeof buildTemplateRows>, n: number, kind: 'in' | 'out') => {
    const label = kind === 'in' ? `Stop ${n} Arrival Time,\nAccordingly, POC In Website` : `Stop ${n} Departure Time,\nAccordingly, POC In Website`;
    return r.rows[0]![r.headers.indexOf(label) + 1] as Date;
  };

  it('gives repeated stop names their OWN time, not the last one’s', () => {
    // HKR2 is both stop 1 and stop 4; stop 1 used to report stop 4's time.
    const r = buildTemplateRows({ tours: [base] });
    expect(new Date(pocUpdated(r, 1, 'in')).getHours()).toBe(14);
    expect(new Date(pocUpdated(r, 4, 'in')).getHours()).toBe(19);
    // TBI1 is stops 2 and 3.
    expect(new Date(pocUpdated(r, 2, 'in')).getHours()).toBe(16);
    expect(new Date(pocUpdated(r, 3, 'in')).getHours()).toBe(17);
  });

  it('falls back to the stamp when there is no audit entry beside it', () => {
    const noTrail = { ...base, history: [] } as unknown as Tour;
    const r = buildTemplateRows({ tours: [noTrail] });
    expect(pocUpdated(r, 1, 'in').getTime()).toBe(stops[0]!.actualArrival);
    expect(pocUpdated(r, 1, 'out').getTime()).toBe(stops[0]!.actualDeparture);
  });

  it('stays blank when the stop was never stamped', () => {
    const open = { ...base, history: [], legs: [{ vrid: '112QM99ZW', stops: [{ name: 'HKR2', arrivalAt: '2026-08-12T14:00' }] }] } as unknown as Tour;
    const r = buildTemplateRows({ tours: [open] });
    expect(pocUpdated(r, 1, 'in')).toBe('');
  });
});

describe('stop 3 departure', () => {
  it('is captured after the template, which has no columns for it', async () => {
    const { cell, headers } = await readBack([base]);
    expect(headers.indexOf('Stop 3 Departure Time (POC)')).toBeGreaterThanOrEqual(TEMPLATE_COLUMN_COUNT);
    expect(shown(cell('Stop 3 Departure Time (POC)'))).toBe('2026-08-12 17:45');
    expect(shown(cell('Stop 3 Departure - Sarva POC Updated Time'))).toBe('2026-08-12 17:45');
  });

  it('leaves the client’s 67 template columns exactly as they were', () => {
    expect(TEMPLATE_COLUMN_COUNT).toBe(67);
  });
});
