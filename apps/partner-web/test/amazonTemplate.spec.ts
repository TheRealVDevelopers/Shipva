/**
 * The Amazon export must match the client's own workbook exactly.
 *
 * `amazon-template-headers.json` is the header row lifted verbatim from
 * "Export file Amazon.xlsx" (27 Jul 2026). If a change to the exporter ever
 * shifts a column, this fails — which is the point: a silent shift files every
 * later value under the wrong heading when they paste into their template.
 */
import { describe, it, expect, vi } from 'vitest';
import SAMPLE_HEADERS from './amazon-template-headers.json';

vi.mock('../src/lib/brand.js', () => ({ brandSlug: 'sarva' }));

const { buildTemplateRows, TEMPLATE_COLUMN_COUNT } = await import('../src/lib/exportAmazonTemplate.js');
type Tour = Parameters<typeof buildTemplateRows>[0]['tours'][number];

const t0 = Date.parse('2026-06-07T12:00:00');

/** Modelled on their sample: one Tour ID, several VR IDs. */
const tour = {
  id: 'T1', date: '7 Jun 2026', tourId: 'T-29FPC0972', vrId: '', seTracker: '', toll: '',
  amzEquipmentType: '10’ Truck', seEquipmentType: "10' Truck",
  amzStatus: 'IN PROGRESS', sarvaStatus: 'IN TRANSIT', present: 'PRESENT',
  scheduleAdhoc: 'SCHEDULE', noLoadLoad: 'load', advanceAmount: '0', paidPending: 'paid',
  driver: 'Yoganantha', vehicleId: 'TN73BX8394', driverNumber: '9043353461',
  vendorName: 'yogananda transport chennai', stops: [],
  totalManualKm: '', amazonRelyKm: '', gpsKm: '', remarks: '',
  serviceAt: '2026-06-07T12:00',
  createdByName: 'Owner · Owner', createdAtMs: t0,
  updatedByName: 'Prakash · Supervisor', updatedAtMs: t0 + 3_600_000,
  legs: [
    {
      vrid: '113VPMWZ6', loadType: 'load',
      stops: [
        { name: 'HCI2', arrivalAt: '2026-06-07T12:00', departureAt: '2026-06-07T13:30', actualArrival: t0, feedback: 'On time' },
        { name: 'TCD7', arrivalAt: '2026-06-07T15:00' },
      ],
      ops: { totalManualKm: '82', amazonRelyKm: '80', gpsKm: '84', podGiven: true, present: 'PRESENT' },
    },
    {
      vrid: '1125VDK5R', loadType: 'load',
      stops: [{ name: 'TCD7', arrivalAt: '2026-06-07T16:30', departureAt: '2026-06-07T17:30' }],
      ops: { totalManualKm: '40' },
    },
  ],
  history: [
    { atMs: t0 - 60_000, by: 'Owner · Owner', action: 'Route created', detail: '2 VRID(s)' },
    { atMs: t0 + 120_000, by: 'Prakash · Supervisor', vrid: '113VPMWZ6', action: 'Checked in', detail: 'HCI2 at 12:02' },
    { atMs: t0 + 3_600_000, by: 'Prakash · Supervisor', vrid: '113VPMWZ6', action: 'VRID updated', detail: 'Amazon KM — → 80' },
  ],
} as unknown as Tour;

const at = (headers: string[], row: unknown[], label: string) => row[headers.indexOf(label)];

describe('Amazon template export', () => {
  it('reproduces the client workbook header row exactly', () => {
    const { headers } = buildTemplateRows({ tours: [tour] });
    expect(TEMPLATE_COLUMN_COUNT).toBe(67);
    expect(headers.slice(0, 67)).toEqual(SAMPLE_HEADERS);
  });

  it('keeps stop 3 three columns short, as their file has it', () => {
    const { headers } = buildTemplateRows({ tours: [tour] });
    // Stop 3's block runs 'Stop 3' … 'Stop 3 Yard Departure' then jumps to Stop 4.
    const s3 = headers.indexOf('Stop 3');
    expect(headers[s3 + 5]).toBe('Stop 3 Yard Departure');
    expect(headers[s3 + 6]).toBe('Stop 4');
    // Every other stop carries the full nine.
    const s2 = headers.indexOf('Stop 2');
    expect(headers[s2 + 6]).toContain('Stop 2 Departure Time');
  });

  it('emits one row per VR ID under the one Tour ID', () => {
    const { headers, rows } = buildTemplateRows({ tours: [tour] });
    expect(rows).toHaveLength(2);
    expect(at(headers, rows[0]!, 'Tour ID')).toBe('T-29FPC0972');
    expect(at(headers, rows[1]!, 'Tour ID')).toBe('T-29FPC0972');
    expect(at(headers, rows[0]!, 'VR ID')).toBe('113VPMWZ6');
    expect(at(headers, rows[1]!, 'VR ID')).toBe('1125VDK5R');
    expect(at(headers, rows[0]!, 'Facility Sequence')).toBe('HCI2->TCD7');
  });

  it('writes real dates, not text', () => {
    const { headers, rows } = buildTemplateRows({ tours: [tour] });
    expect(at(headers, rows[0]!, 'Date')).toBeInstanceOf(Date);
    expect(at(headers, rows[0]!, 'Stop 1 Yard Arrival')).toBeInstanceOf(Date);
  });

  it('fills the POC arrival and its update time from the audit trail', () => {
    const { headers, rows } = buildTemplateRows({ tours: [tour] });
    const r = rows[0]!;
    const pocArrival = headers.indexOf('Stop 1 Arrival Time,\nAccordingly, POC In Website');
    expect(r[pocArrival]).toBeInstanceOf(Date);
    // The "Sarva POC Updated Time" beside it comes from the Checked-in event.
    expect(r[pocArrival + 1]).toBeInstanceOf(Date);
    expect((r[pocArrival + 1] as Date).getTime()).toBe(t0 + 120_000);
    expect(r[pocArrival + 2]).toBe('On time'); // Feedback
  });

  it('appends the requested extra columns after the template', () => {
    const { headers, rows } = buildTemplateRows({ tours: [tour] });
    for (const label of ['Created by', 'Created date', 'Created time',
      'Updated by', 'Updated date', 'Updated time', 'Status', 'Manual KM', 'Full update history']) {
      expect(headers.indexOf(label)).toBeGreaterThanOrEqual(67);
    }
    const r = rows[0]!;
    expect(at(headers, r, 'Created by')).toBe('Owner · Owner');
    expect(at(headers, r, 'Updated by')).toBe('Prakash · Supervisor');
    expect(at(headers, r, 'Manual KM')).toBe(82);
    expect(at(headers, r, 'Status')).toBe('In Transit');
    // Full history, not just the latest.
    expect(String(at(headers, r, 'Full update history'))).toContain('Route created');
    expect(String(at(headers, r, 'Full update history'))).toContain('Amazon KM');
  });

  it('carries per-VRID values, not the whole route’s', () => {
    const { headers, rows } = buildTemplateRows({ tours: [tour] });
    expect(at(headers, rows[0]!, 'Manual KM')).toBe(82);
    expect(at(headers, rows[1]!, 'Manual KM')).toBe(40);
  });
});
