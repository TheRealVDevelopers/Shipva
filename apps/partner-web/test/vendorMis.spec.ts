import { describe, it, expect } from 'vitest';
import {
  countTrips, dieselAdvanced, misSummary, inRange, cycleStage, canRaiseInvoice,
  vendorTotals, monthlySummary, dueForReminder,
} from '../src/lib/vendorMis.js';
import type { Invoice } from '../src/lib/mocks.js';

const inv = (p: Partial<Invoice>): Invoice => ({
  no: 'INV-1', client: 'A A Transport', date: '1 Aug 2026', dueDate: '15 Aug 2026',
  basePaise: 0, gstPaise: 0, totalPaise: 0, status: 'pending', ...p,
});

describe('inRange', () => {
  it('accepts labels and ISO alike', () => {
    expect(inRange('24 Jul 2026', '2026-07-01', '2026-07-31')).toBe(true);
    expect(inRange('2026-07-24', '2026-07-01', '2026-07-31')).toBe(true);
  });
  it('excludes dates outside the window', () => {
    expect(inRange('24 Aug 2026', '2026-07-01', '2026-07-31')).toBe(false);
  });
  it('treats an open end as unbounded', () => {
    expect(inRange('2026-12-31', '2026-07-01', '')).toBe(true);
  });
});

describe('countTrips — the automatic trip count', () => {
  const runs = [
    { vendorName: 'A A Transport', date: '2026-07-05', vehicleId: 'KA05K2245' },
    { vendorName: 'A A Transport', date: '2026-07-19', vehicleId: 'KA05K2245' },
    { vendorName: 'A A Transport', date: '2026-07-20', vehicleId: 'KA09H8810' },
    { vendorName: 'Other Roadlines', date: '2026-07-21', vehicleId: 'KA05K2245' },
    { vendorName: 'A A Transport', date: '2026-08-02', vehicleId: 'KA05K2245' },
  ];
  it('counts only that vendor inside the window', () => {
    expect(countTrips(runs, 'A A Transport', '2026-07-01', '2026-07-31')).toBe(3);
  });
  it('narrows further by vehicle when one is chosen', () => {
    expect(countTrips(runs, 'A A Transport', '2026-07-01', '2026-07-31', 'KA05K2245')).toBe(2);
  });
  it('ignores bracket and spacing drift in the vendor name', () => {
    expect(countTrips(runs, '(A A Transport)', '2026-07-01', '2026-07-31')).toBe(3);
  });
  it('is zero with no vendor', () => {
    expect(countTrips(runs, '', '2026-07-01', '2026-07-31')).toBe(0);
  });
});

describe('dieselAdvanced', () => {
  const adv = [
    { kind: 'diesel', status: 'approved', vendorName: 'A A Transport', amountPaise: 500000, serviceAt: '2026-07-05' },
    { kind: 'diesel', status: 'approved', vendorName: 'A A Transport', amountPaise: 300000, serviceAt: '2026-07-22' },
    { kind: 'diesel', status: 'pending', vendorName: 'A A Transport', amountPaise: 900000, serviceAt: '2026-07-23' },
    { kind: 'expense', status: 'approved', vendorName: 'A A Transport', amountPaise: 100000, serviceAt: '2026-07-24' },
    { kind: 'diesel', status: 'approved', vendorName: 'A A Transport', amountPaise: 700000, serviceAt: '2026-08-04' },
  ];
  it('sums only approved diesel inside the window', () => {
    expect(dieselAdvanced(adv, 'A A Transport', '2026-07-01', '2026-07-31')).toBe(800000);
  });
  it('leaves a pending advance out — it has not left the bank', () => {
    const only = adv.filter((a) => a.status === 'pending');
    expect(dieselAdvanced(only, 'A A Transport', '2026-07-01', '2026-07-31')).toBe(0);
  });
});

describe('misSummary', () => {
  it('adds extra km, toll and other, then deducts the diesel advance', () => {
    const s = misSummary({
      monthlyCostPaise: 5_000_000, extraKmPaise: 2000, allowanceKm: 6000, runKm: 6500,
      tollPaise: 150_000, otherChargesPaise: 50_000, dieselAdvancePaise: 800_000,
    });
    expect(s.extraKm).toBe(500);
    expect(s.extraKmPaise).toBe(1_000_000);
    expect(s.grossPaise).toBe(5_000_000 + 1_000_000 + 150_000 + 50_000);
    expect(s.netPaise).toBe(s.grossPaise - 800_000);
  });
  it('charges no extra km within the allowance', () => {
    const s = misSummary({ monthlyCostPaise: 5_000_000, extraKmPaise: 2000, allowanceKm: 6000, runKm: 5500 });
    expect(s.extraKm).toBe(0);
    expect(s.netPaise).toBe(5_000_000);
  });
  it('never bills a negative net when advances exceed earnings', () => {
    const s = misSummary({ monthlyCostPaise: 100_000, dieselAdvancePaise: 500_000 });
    expect(s.netPaise).toBe(0);
  });
});

describe('vendor agreement cycle', () => {
  it('reports each stage', () => {
    expect(cycleStage(inv({ status: 'draft' }))).toBe('Draft');
    expect(cycleStage(inv({}))).toBe('Not sent');
    expect(cycleStage(inv({ sentToVendorOn: '2 Aug 2026' }))).toBe('Sent to vendor');
    expect(cycleStage(inv({ sentToVendorOn: '2 Aug 2026', disputeOn: '3 Aug 2026' }))).toBe('Disputed');
    expect(cycleStage(inv({ sentToVendorOn: '2 Aug 2026', noDisputeOn: '4 Aug 2026' }))).toBe('Agreed');
  });
  it('only allows an invoice once the vendor has agreed', () => {
    expect(canRaiseInvoice(inv({ sentToVendorOn: '2 Aug 2026' }))).toBe(false);
    expect(canRaiseInvoice(inv({ noDisputeOn: '4 Aug 2026' }))).toBe(true);
  });
});

describe('dashboard totals', () => {
  const rows = [
    inv({ no: 'A', status: 'pending', totalPaise: 100 }),
    inv({ no: 'B', status: 'processing', totalPaise: 200 }),
    inv({ no: 'C', status: 'paid', totalPaise: 300 }),
    inv({ no: 'D', status: 'draft', totalPaise: 999 }),
  ];
  it('splits by status and keeps drafts out of the total', () => {
    const t = vendorTotals(rows);
    expect(t.pending).toBe(100);
    expect(t.processing).toBe(200);
    expect(t.paid).toBe(300);
    expect(t.total).toBe(600);
  });
  it('summarises by month, newest first', () => {
    const m = monthlySummary([
      inv({ no: 'A', periodTo: '2026-07-31', totalPaise: 100 }),
      inv({ no: 'B', periodTo: '2026-08-31', totalPaise: 200 }),
      inv({ no: 'C', periodTo: '2026-08-15', totalPaise: 50 }),
    ]);
    expect(m[0]).toEqual({ month: '2026-08', paise: 250, count: 2 });
    expect(m[1]).toEqual({ month: '2026-07', paise: 100, count: 1 });
  });
});

describe('dueForReminder — the automatic accounts reminder', () => {
  it('picks up rows due today or overdue that are unpaid', () => {
    const rows = [
      inv({ no: 'A', dueDate: '2026-08-09', status: 'pending' }),
      inv({ no: 'B', dueDate: '2026-08-01', status: 'processing' }),
      inv({ no: 'C', dueDate: '2026-08-20', status: 'pending' }),
      inv({ no: 'D', dueDate: '2026-08-01', status: 'paid' }),
      inv({ no: 'E', dueDate: '2026-08-01', status: 'draft' }),
    ];
    expect(dueForReminder(rows, '2026-08-09').map((r) => r.no)).toEqual(['A', 'B']);
  });
  it('does not remind twice on the same day', () => {
    const rows = [inv({ no: 'A', dueDate: '2026-08-01', reminderOn: '2026-08-09' })];
    expect(dueForReminder(rows, '2026-08-09')).toHaveLength(0);
  });
});
