/**
 * Proves the run export does what the client asked: one row per VR ID, the
 * audit columns populated, and the FULL history in the row — not just the
 * latest values.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const captured: { name: string; headers: string[]; rows: unknown[][] }[] = [];
vi.mock('../src/lib/exportExcel.js', () => ({
  exportRows: (name: string, headers: string[], rows: unknown[][]) => {
    captured.push({ name, headers, rows });
  },
}));
vi.mock('../src/lib/brand.js', () => ({ brandSlug: 'sarva' }));

const { exportRuns, exportRunHistory } = await import('../src/lib/exportRuns.js');
type Tour = Parameters<typeof exportRuns>[0]['tours'][number];

const t0 = Date.parse('2026-07-20T09:00:00Z');

const tour = {
  id: 'T1', date: '28 Jul 2026', tourId: 'T-32FPC0963', vrId: '', seTracker: '', toll: '',
  amzEquipmentType: '32ft SXL', seEquipmentType: '', amzStatus: 'IN PROGRESS', sarvaStatus: 'IN PROGRESS',
  present: 'PRESENT', scheduleAdhoc: 'SCHEDULE', noLoadLoad: 'Load', advanceAmount: '3000',
  paidPending: 'Pending', driver: 'Ramesh', vehicleId: 'KA05K2245', driverNumber: '9900112233',
  vendorName: 'Captan Bharathi Raj', stops: [], totalManualKm: '', amazonRelyKm: '', gpsKm: '',
  remarks: '', serviceAt: '2026-07-28T19:30',
  createdByName: 'Owner · Owner', createdAtMs: t0,
  updatedByName: 'Prakash · Supervisor', updatedAtMs: t0 + 7_200_000,
  ownerName: 'Prakash',
  legs: [
    {
      vrid: '114G4M6QY', loadType: 'Load',
      stops: [{ name: 'HKR3', arrivalAt: '2026-07-28T19:30', departureAt: '2026-07-28T20:30', actualArrival: t0 + 3_600_000 }],
      ops: { startKm: '12500', endKm: '12582', totalManualKm: '82', amazonRelyKm: '80', gpsKm: '84', podGiven: true },
    },
    {
      vrid: '229H5N7RZ', loadType: 'No Load',
      stops: [{ name: 'HCI2', arrivalAt: '2026-07-28T22:00', departureAt: '2026-07-28T22:31' }],
      ops: { startKm: '12582', endKm: '12610', totalManualKm: '28', amazonRelyKm: '30', gpsKm: '29' },
    },
  ],
  history: [
    { atMs: t0, by: 'Owner · Owner', action: 'Route created', detail: '2 VRID(s)' },
    { atMs: t0 + 3_600_000, by: 'Prakash · Supervisor', vrid: '114G4M6QY', action: 'Checked in', detail: 'HKR3 at 14:30' },
    { atMs: t0 + 5_400_000, by: 'Prakash · Supervisor', vrid: '114G4M6QY', action: 'VRID updated', detail: 'Amazon KM — → 80' },
    { atMs: t0 + 7_200_000, by: 'Prakash · Supervisor', vrid: '114G4M6QY', action: 'VRID updated', detail: 'Amazon KM 80 → 84' },
    { atMs: t0 + 1_800_000, by: 'Asha · Team Leader', vrid: '229H5N7RZ', action: 'Load type set', detail: 'No Load' },
  ],
} as unknown as Tour;

const col = (headers: string[], row: unknown[], label: string) => row[headers.indexOf(label)];

beforeEach(() => { captured.length = 0; });

describe('run export', () => {
  it('emits one row per VR ID, not one per trip', () => {
    const n = exportRuns({ tours: [tour], name: 'test' });
    expect(n).toBe(2);
    const { headers, rows } = captured[0]!;
    expect(rows).toHaveLength(2);
    expect(col(headers, rows[0]!, 'VR ID')).toBe('114G4M6QY');
    expect(col(headers, rows[1]!, 'VR ID')).toBe('229H5N7RZ');
    // Both rows carry the shared trip identity.
    expect(col(headers, rows[0]!, 'Trip ID')).toBe('T-32FPC0963');
    expect(col(headers, rows[1]!, 'Trip ID')).toBe('T-32FPC0963');
    expect(col(headers, rows[0]!, 'VR ID no.')).toBe('1 of 2');
    expect(col(headers, rows[1]!, 'VR ID no.')).toBe('2 of 2');
  });

  it('carries created/updated by and time, status and manual KM', () => {
    exportRuns({ tours: [tour], name: 'test' });
    const { headers, rows } = captured[0]!;
    const r = rows[0]!;
    expect(col(headers, r, 'Created by')).toBe('Owner · Owner');
    expect(col(headers, r, 'Created date')).toBeTruthy();
    expect(col(headers, r, 'Created time')).toBeTruthy();
    expect(col(headers, r, 'Updated by')).toBe('Prakash · Supervisor');
    expect(col(headers, r, 'Updated date')).toBeTruthy();
    expect(col(headers, r, 'Updated time')).toBeTruthy();
    expect(col(headers, r, 'Status')).toBe('In Transit');
    // Manual KM is numeric so Excel can total it.
    expect(col(headers, r, 'Manual KM')).toBe(82);
    expect(col(headers, rows[1]!, 'Manual KM')).toBe(28);
    expect(col(headers, r, 'KM variance (GPS - Amazon)')).toBe(4);
  });

  it('carries the FULL history per VR ID, not just the latest', () => {
    exportRuns({ tours: [tour], name: 'test' });
    const { headers, rows } = captured[0]!;
    const log = String(col(headers, rows[0]!, 'Full update history'));
    // Both KM edits are present — the earlier one is not overwritten.
    expect(log).toContain('Amazon KM — → 80');
    expect(log).toContain('Amazon KM 80 → 84');
    expect(log).toContain('Checked in');
    // Route-wide events belong to every VRID...
    expect(log).toContain('Route created');
    // ...but another VRID's events do not leak in.
    expect(log).not.toContain('Load type set');
    expect(col(headers, rows[0]!, 'Updates')).toBe(4); // created + 3 own
    expect(col(headers, rows[1]!, 'Updates')).toBe(2); // created + 1 own
  });

  it('history export gives one row per update, route events listed once', () => {
    const n = exportRunHistory({ tours: [tour], name: 'test' });
    const { headers, rows } = captured[0]!;
    expect(n).toBe(rows.length);
    // 4 VRID-specific + 1 route-wide, counted once.
    expect(rows).toHaveLength(5);
    const routeRows = rows.filter((r) => col(headers, r, 'VR ID') === '(whole route)');
    expect(routeRows).toHaveLength(1);
    expect(col(headers, routeRows[0]!, 'Action')).toBe('Route created');
    const first = rows.find((r) => col(headers, r, 'Action') === 'Checked in')!;
    expect(col(headers, first, 'Updated by')).toBe('Prakash · Supervisor');
    expect(col(headers, first, 'What changed')).toContain('HKR3');
  });

  it('a legacy route with no legs still exports one row', () => {
    const legacy = { ...tour, legs: undefined, vrIds: ['OLD123'], history: [] } as unknown as Tour;
    const n = exportRuns({ tours: [legacy], name: 'test' });
    expect(n).toBe(1);
    const { headers, rows } = captured[0]!;
    expect(col(headers, rows[0]!, 'VR ID')).toBe('OLD123');
  });
});
