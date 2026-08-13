/**
 * Vendor Payment MIS — the figures behind a monthly vendor settlement.
 *
 * The MIS is raised for one transporter, one vehicle and one date range. What
 * it owes is worked out from the rate card (monthly package + kilometres beyond
 * the allowance), plus the charges a card can't know about (toll, other), minus
 * whatever diesel was already advanced in that window.
 *
 * All of it lives here rather than in the page so the arithmetic can be tested
 * — a settlement that quietly mis-adds is far worse than one that looks wrong.
 */
import { labelToIso } from './format.js';
import type { Invoice, InvoiceStatus } from './mocks.js';

/** A run the MIS can count. Both tours and trips reduce to this. */
export interface CountableRun {
  vendorName?: string | undefined;
  /** Display label ("24 Jul 2026") or ISO — both are accepted. */
  date?: string | undefined;
  vehicleId?: string | undefined;
}

/** A diesel advance already paid out. */
export interface CountableAdvance {
  kind?: string | undefined;
  vendorName?: string | undefined;
  status?: string | undefined;
  amountPaise?: number | undefined;
  createdOn?: string | undefined;
  serviceAt?: string | undefined;
  vehicleId?: string | undefined;
}

/** Normalise a vendor name for comparison — the register has had spacing and
 *  bracket drift before, so matching is deliberately forgiving. */
const norm = (v?: string): string =>
  (v ?? '').toLowerCase().replace(/[()[\]{}.,-]/g, ' ').replace(/\s+/g, ' ').trim();

/** Best-effort ISO date (yyyy-mm-dd) from either an ISO string or a label. */
export function toIso(v?: string): string {
  const s = (v ?? '').trim();
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const iso = labelToIso(s);
  return /^\d{4}-\d{2}-\d{2}/.test(iso) ? iso.slice(0, 10) : '';
}

/** Is `date` inside [from, to]? An open end is treated as unbounded. */
export function inRange(date?: string, from?: string, to?: string): boolean {
  const d = toIso(date);
  if (!d) return false;
  const f = toIso(from), t = toIso(to);
  if (f && d < f) return false;
  if (t && d > t) return false;
  return true;
}

/**
 * How many runs this vendor did in the window — the MIS's automatic trip count.
 * Filtered by vehicle too when one is chosen, since a vendor running three
 * lorries settles each separately.
 */
export function countTrips(
  runs: CountableRun[], vendorName: string, from?: string, to?: string, vehicleReg?: string,
): number {
  const v = norm(vendorName);
  if (!v) return 0;
  const reg = norm(vehicleReg);
  return runs.filter((r) => norm(r.vendorName) === v
    && inRange(r.date, from, to)
    && (!reg || norm(r.vehicleId) === reg)).length;
}

/**
 * Diesel already advanced to this vendor in the window, in paise. Only approved
 * requests count — a pending one hasn't left the bank, and deducting it would
 * short-pay the vendor.
 */
export function dieselAdvanced(
  advances: CountableAdvance[], vendorName: string, from?: string, to?: string, vehicleReg?: string,
): number {
  const v = norm(vendorName);
  if (!v) return 0;
  const reg = norm(vehicleReg);
  return advances
    .filter((a) => a.kind === 'diesel'
      && a.status === 'approved'
      && norm(a.vendorName) === v
      && inRange(a.serviceAt || a.createdOn, from, to)
      && (!reg || norm(a.vehicleId) === reg))
    .reduce((sum, a) => sum + (a.amountPaise ?? 0), 0);
}

export interface MisInputs {
  monthlyCostPaise?: number | undefined;
  extraKmPaise?: number | undefined;
  allowanceKm?: number | undefined;
  runKm?: number | undefined;
  tollPaise?: number | undefined;
  otherChargesPaise?: number | undefined;
  dieselAdvancePaise?: number | undefined;
}

export interface MisSummary {
  monthlyPaise: number;
  extraKm: number;
  extraKmPaise: number;
  tollPaise: number;
  otherPaise: number;
  /** What the vendor has earned before deductions. */
  grossPaise: number;
  dieselAdvancePaise: number;
  /** Gross less the diesel already advanced — what the MIS actually bills. */
  netPaise: number;
}

/**
 * The payment summary. Kilometres beyond the card's allowance are charged at
 * the card's extra-km rate; toll and other charges are added on; diesel already
 * advanced is deducted. Never returns a negative net — if the advances exceed
 * the earnings the vendor owes nothing this cycle rather than being billed.
 */
export function misSummary(i: MisInputs): MisSummary {
  const monthlyPaise = i.monthlyCostPaise ?? 0;
  const allowance = i.allowanceKm ?? 0;
  const run = Number.isFinite(i.runKm) ? (i.runKm ?? 0) : 0;
  const extraKm = allowance > 0 && run > allowance ? run - allowance : 0;
  const extraKmPaise = extraKm * (i.extraKmPaise ?? 0);
  const tollPaise = i.tollPaise ?? 0;
  const otherPaise = i.otherChargesPaise ?? 0;
  const grossPaise = monthlyPaise + extraKmPaise + tollPaise + otherPaise;
  const dieselAdvancePaise = i.dieselAdvancePaise ?? 0;
  return {
    monthlyPaise, extraKm, extraKmPaise, tollPaise, otherPaise,
    grossPaise, dieselAdvancePaise,
    netPaise: Math.max(0, grossPaise - dieselAdvancePaise),
  };
}

/** Where an MIS row sits in the vendor agreement cycle, for the row badge. */
export function cycleStage(i: Invoice): string {
  if (i.status === 'draft') return 'Draft';
  if (i.disputeOn && !i.noDisputeOn) return 'Disputed';
  if (i.noDisputeOn) return 'Agreed';
  if (i.sentToVendorOn) return 'Sent to vendor';
  return 'Not sent';
}

/** An MIS row can only be settled once the vendor has agreed it. */
export const canRaiseInvoice = (i: Invoice): boolean => !!i.noDisputeOn;

/** Money the business owes vendors, split the way the dashboard shows it. */
export function vendorTotals(invoices: Invoice[]): Record<InvoiceStatus | 'total', number> {
  const t = { draft: 0, pending: 0, processing: 0, paid: 0, overdue: 0, total: 0 };
  for (const i of invoices) {
    t[i.status] = (t[i.status] ?? 0) + i.totalPaise;
    // Drafts are not committed spend, so they stay out of the headline total.
    if (i.status !== 'draft') t.total += i.totalPaise;
  }
  return t;
}

/** Month-by-month vendor spend, newest first — the monthly summary. */
export function monthlySummary(invoices: Invoice[]): { month: string; paise: number; count: number }[] {
  const by = new Map<string, { paise: number; count: number }>();
  for (const i of invoices) {
    if (i.status === 'draft') continue;
    const iso = toIso(i.periodTo || i.periodFrom || i.date);
    if (!iso) continue;
    const key = iso.slice(0, 7);
    const cur = by.get(key) ?? { paise: 0, count: 0 };
    by.set(key, { paise: cur.paise + i.totalPaise, count: cur.count + 1 });
  }
  return [...by.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([month, v]) => ({ month, ...v }));
}

/**
 * MIS rows whose payment is due and not yet settled — what the accounts team is
 * reminded about. `todayIso` is passed in rather than read from the clock so
 * the rule can be tested.
 */
export function dueForReminder(invoices: Invoice[], todayIso: string): Invoice[] {
  return invoices.filter((i) => {
    if (i.status === 'paid' || i.status === 'draft') return false;
    const due = toIso(i.dueDate);
    if (!due) return false;
    // Due today or already past, and not already reminded today.
    return due <= todayIso && toIso(i.reminderOn) !== todayIso;
  });
}
