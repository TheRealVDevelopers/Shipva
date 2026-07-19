// Mock data for the partner dashboard preview. Money in paise.
import type { BookingStatus, DutyStatus, KycStatus, VehicleType, VerifyStatus } from '@shipva/shared-types';

export const partner = {
  company: 'Karnataka Roadlines',
  contact: 'Mahesh Gowda',
  phone: '+91 99452 11000',
  region: 'Peenya corridor · Bengaluru',
  gstin: '29ABCDE1234F1Z5',
  verifyStatus: 'verified' as VerifyStatus,
  ratingAvg: 4.6,
  ratingCount: 318,
};

export const subscription = {
  tier: 'Growth',
  pricePaise: 399900,
  driverSlots: 20,
  driversUsed: 12,
  renewalOn: '15 Jul 2026',
  trial: false,
};

export const PLANS = [
  { tier: 'Starter', pricePaise: 149900, drivers: 5, blurb: 'New owners getting started' },
  { tier: 'Growth', pricePaise: 399900, drivers: 20, blurb: 'Scaling fleets', current: true },
  { tier: 'Pro', pricePaise: 899900, drivers: 60, blurb: 'Large transporters', features: ['Priority loads', 'Smart match'] },
];

export const counters = {
  activeJobs: 5,
  driversOnline: 7,
  loadsToClaim: 9,
  earningsMonthPaise: 38640000,
};

export interface FleetDriver {
  id: string; name: string; phone: string;
  /** A driver belongs to a vendor, not to a vehicle — the vehicle is chosen per
   *  trip. Both are optional: the Driver Register no longer collects them, and
   *  older records (and the inline add-driver on a trip) still carry them. */
  vehicleReg?: string | undefined; vehicleType?: VehicleType | undefined;
  dutyStatus: DutyStatus; kycStatus: KycStatus; ratingAvg: number; tripsToday: number;
  /** Vendor (truck owner) this driver belongs to; empty/undefined = own fleet. */
  vendor?: string | undefined;
  /** Compliance documents — empty/undefined = not provided. */
  aadhaar?: string; licenseNo?: string; licenseExpiry?: string; pan?: string;
  /** Uploaded document images (compressed data-URLs; real storage with backend). */
  aadhaarImg?: string | undefined; licenseImg?: string | undefined; panImg?: string | undefined;
  /** Set by an owner/manager once they've checked the documents. */
  verified?: boolean | undefined; verifiedBy?: string | undefined; verifiedOn?: string | undefined;
}
// Demo drivers removed — the org is live, drivers come from Firestore only.

export interface Truck {
  id: string; reg: string;
  /** Admin-managed label, not a fixed union — the client sets the list (see
   *  lib/truckTypes). Existing records carry the old VehicleType values. */
  type: string;
  capacityKg: number; status: 'available' | 'on_trip' | 'maintenance'; docsOk: boolean;
  /** Box size — the "vehicle type" Amazon cares about (10ft/14ft/17ft…). */
  feet?: string | undefined;
  /** Vendor (truck owner) this vehicle belongs to; empty/undefined = own fleet. */
  vendor?: string | undefined;
  /** Compliance documents — empty/undefined = not submitted. */
  rc?: string; insuranceNo?: string; insuranceExpiry?: string; fitnessNo?: string; fitnessExpiry?: string;
  /** Uploaded document images (compressed data-URLs; real storage with backend). */
  rcImg?: string | undefined; insuranceImg?: string | undefined; fitnessImg?: string | undefined;
  /** Set by an owner/manager once they've checked the documents. A truck can't
   *  be assigned to a trip until this is true. */
  verified?: boolean | undefined; verifiedBy?: string | undefined; verifiedOn?: string | undefined;
}
// Demo trucks removed — the org is live, trucks come from Firestore only.

/**
 * Was this record's paperwork signed off? Trucks and drivers that predate the
 * verification gate have no `verified` flag at all — they're already out
 * working, so grandfather them rather than stopping every trip on the day the
 * gate ships. Anything added since sets `verified: false` explicitly, so an
 * absent flag reliably means "legacy" and a false one means "not checked yet".
 */
export const isVerified = (r: { verified?: boolean | undefined }): boolean => r.verified ?? true;

export type LoadKind = 'instant' | 'auction' | 'backhaul';
export interface Load {
  id: string; from: string; to: string; poster: string; vehicleType: VehicleType;
  distanceKm: number; date: string; basePricePaise: number; kind: LoadKind; bidCount?: number; minsAgo: number;
}
export const loadBoard: Load[] = [
  { id: 'GN-8101', from: 'Peenya', to: 'Hosur', poster: 'Bharat Steels', vehicleType: 'truck', distanceKm: 48, date: 'Today', basePricePaise: 520000, kind: 'instant', minsAgo: 4 },
  { id: 'GN-8102', from: 'Bengaluru', to: 'Chennai', poster: 'Vexa Polymers (KASSIA)', vehicleType: 'pickup', distanceKm: 348, date: 'Tomorrow', basePricePaise: 1192500, kind: 'auction', bidCount: 3, minsAgo: 26 },
  { id: 'GN-8103', from: 'Hosur (return)', to: 'Peenya', poster: 'Deccan Freight', vehicleType: 'truck', distanceKm: 42, date: 'Today', basePricePaise: 300000, kind: 'backhaul', minsAgo: 38 },
  { id: 'GN-8104', from: 'Bengaluru', to: 'Hyderabad', poster: 'FreshCo Dairy', vehicleType: 'reefer', distanceKm: 575, date: '28 Jun', basePricePaise: 2914000, kind: 'auction', bidCount: 5, minsAgo: 52 },
  { id: 'GN-8105', from: 'Whitefield', to: 'Electronic City', poster: 'Leela Stores', vehicleType: 'tempo', distanceKm: 31, date: 'Today', basePricePaise: 98000, kind: 'instant', minsAgo: 60 },
  { id: 'GN-8106', from: 'Tumakuru (return)', to: 'Peenya', poster: 'Karnataka Roadlines', vehicleType: 'mini_truck', distanceKm: 70, date: 'Tomorrow', basePricePaise: 88000, kind: 'backhaul', minsAgo: 80 },
];

export interface ActiveJob {
  id: string; from: string; to: string; driverName: string; vehicleType: VehicleType; status: BookingStatus; etaMin: number;
}
export const activeJobs: ActiveJob[] = [
  { id: 'GN-8090', from: 'Peenya', to: 'Electronic City', driverName: 'Ramesh Yadav', vehicleType: 'truck', status: 'in_transit', etaMin: 22 },
  { id: 'GN-8088', from: 'Whitefield', to: 'KR Puram', driverName: 'Iqbal Sharief', vehicleType: 'truck', status: 'picked_up', etaMin: 35 },
  { id: 'GN-8086', from: 'Bengaluru', to: 'Hosur', driverName: 'Sathish Reddy', vehicleType: 'pickup', status: 'arrived', etaMin: 48 },
  { id: 'GN-8084', from: 'Peenya', to: 'Yelahanka', driverName: 'Lokesh M', vehicleType: 'tempo', status: 'assigned', etaMin: 12 },
];

export interface EarningRow {
  id: string; from: string; to: string; driverName: string; vehicleType: VehicleType; payoutPaise: number; date: string;
}
export const earnings: EarningRow[] = [
  { id: 'GN-8071', from: 'Peenya', to: 'Hosur', driverName: 'Ramesh Yadav', vehicleType: 'truck', payoutPaise: 510000, date: '26 Jun' },
  { id: 'GN-8068', from: 'Bengaluru', to: 'Chennai', driverName: 'Sathish Reddy', vehicleType: 'pickup', payoutPaise: 1150000, date: '25 Jun' },
  { id: 'GN-8060', from: 'Whitefield', to: 'Mysuru', driverName: 'Naveen Kumar', vehicleType: 'tempo', payoutPaise: 412000, date: '24 Jun' },
  { id: 'GN-8055', from: 'Peenya', to: 'Tumakuru', driverName: 'Lokesh M', vehicleType: 'tempo', payoutPaise: 268000, date: '24 Jun' },
  { id: 'GN-8049', from: 'Bengaluru', to: 'Hyderabad', driverName: 'Iqbal Sharief', vehicleType: 'truck', payoutPaise: 2640000, date: '22 Jun' },
];

// Demo payout history removed — settled cycles will appear here once payroll is
// actually run. Consumers must handle this being empty.
export const payouts: { id: string; period: string; amountPaise: number; status: string; on: string }[] = [];

/* ===================== Transporter OS datasets ===================== */

/** Headline counters for the redesigned Overview (money in paise). */
export const osCounters = {
  revenueMtdPaise: 38640000,
  expenseMtdPaise: 25100000,
  profitMtdPaise: 13540000,
  outstandingPaise: 61250000,
  activeTrips: 5,
  driversTotal: 6,
  fleetSize: 5,
  utilizationPct: 68,
  fuelMtdPaise: 9800000,
  avgMarginPct: 35,
  tripsMtd: 47,
};

export const months6 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
export const revenueSeries = [32000000, 35500000, 31000000, 38000000, 41200000, 38640000];
export const expenseSeries = [21000000, 23500000, 22000000, 24000000, 26800000, 25100000];
export const fuelSeries = [7800000, 8200000, 7500000, 8600000, 9400000, 9800000];
export const profitSpark = revenueSeries.map((r, i) => r - expenseSeries[i]!);

/** Small sparkline series for stat cards. */
export const sparks = {
  revenue: [28, 31, 27, 34, 39, 42, 38, 41],
  profit: [9, 12, 10, 13, 12, 15, 13, 16],
  outstanding: [72, 70, 66, 63, 65, 61, 59, 61],
  trips: [6, 5, 8, 7, 9, 7, 8, 9],
};

export interface ExpenseSlice { label: string; value: number; color: string }
export const expenseBreakdown: ExpenseSlice[] = [
  { label: 'Fuel', value: 9800000, color: 'var(--sx-accent-500)' },
  { label: 'Salaries', value: 7200000, color: 'var(--sx-primary-500)' },
  { label: 'Toll & RTO', value: 3100000, color: '#0ea5e9' },
  { label: 'Maintenance', value: 2600000, color: '#8b5cf6' },
  { label: 'Misc', value: 2400000, color: 'var(--sx-neutral-400)' },
];

/** Receivables aging buckets (paise). */
export const receivables = {
  outstandingPaise: 61250000,
  collectedMtdPaise: 44200000,
  aging: [
    { bucket: '0–30 days', amountPaise: 28500000, tone: 'success' as const },
    { bucket: '31–60 days', amountPaise: 18000000, tone: 'warning' as const },
    { bucket: '61–90 days', amountPaise: 9750000, tone: 'accent' as const },
    { bucket: '90+ days', amountPaise: 5000000, tone: 'danger' as const },
  ],
};

export const fuel = {
  mtdCostPaise: 9800000,
  expectedPaise: 9100000,   // (distance ÷ mileage) × diesel rate
  leakagePaise: 700000,
};

export interface DocAlert { reg: string; doc: string; dueInDays: number }
export const docAlerts: DocAlert[] = [
  { reg: 'KA05K2245', doc: 'Insurance', dueInDays: 4 },
  { reg: 'KA09H8810', doc: 'National Permit', dueInDays: 12 },
  { reg: 'KA01C5521', doc: 'Fitness Certificate', dueInDays: 26 },
];

export type TripStatus = 'assigned' | 'loading' | 'in_transit' | 'at_drop' | 'pod_pending' | 'closed';
/** A stop on a trip. First point is always the pickup, last is the final drop,
 *  anything in between is an intermediate point. `mapUrl` is an optional Google
 *  Maps link the driver can tap. */
export interface TripPoint { label: string; mapUrl?: string }
export interface Trip {
  lr: string; date: string; from: string; to: string; driver: string; vehicleReg: string;
  material: string; weightKg: number; freightPaise: number; status: TripStatus; ewayBill: boolean;
  /** Auto-generated VR (vehicle-run) ID stamped on every new trip. */
  vrId?: string;
  customer?: string;
  /** Ordered stops (pickup → … → drop). Absent on legacy trips (fall back to from/to). */
  points?: TripPoint[];
  /** Progress along the live status timeline (0 = just assigned). */
  stepIndex?: number;
  /** Cancelled/archived — kept for the record, hidden from the board. The client's
   *  rule: never permanently delete; archive or cancel instead. */
  archived?: boolean | undefined;
  archivedAtMs?: number | undefined;
  /** Free-text note captured when the trip is finished (e.g. "police checkpost delay"). */
  remark?: string;
  /** Reported delays — same audit log a tour keeps. Typed loosely here to avoid
   *  a cycle with store.tsx, which owns DelayReport. */
  reports?: {
    id: string; vrid: string; event: string; reason: string;
    scheduledAt: string; estimatedAt: string; remarks?: string; audioUrl?: string;
    byName: string; atMs: number;
  }[];
  /** Firestore doc id (present once the trip is backed by the backend). */
  id?: string;
  /** The supervisor/member who handles this trip. Owner/managers see all; a
   *  supervisor sees only trips where ownerUid is theirs. */
  ownerUid?: string;
  ownerName?: string;
  /** The team (Team Leader's uid) this trip belongs to — a TL sees their team. */
  leaderUid?: string;
  createdAtMs?: number;
}
// The demo trips that used to live here were removed when the org went live —
// real trips only. Nothing should fabricate business records.

export type InvoiceStatus = 'paid' | 'pending' | 'overdue';
export interface Invoice {
  /** Firestore doc id (assigned on write); `no` is the human invoice number. */
  id?: string;
  no: string; client: string; date: string; dueDate: string;
  basePaise: number; gstPaise: number; totalPaise: number; status: InvoiceStatus;
}
// Demo invoices removed — real billing only.

export interface Expense { id?: string; date: string; tripLr: string; category: string; amountPaise: number; note: string }
// Demo expenses removed.

export interface FuelLog {
  id?: string;
  date: string; reg: string; km: number; litres: number; ratePaise: number; costPaise: number; expectedPaise: number; ok: boolean;
}
// Demo fuel logs removed.

export interface VehicleDoc { reg: string; doc: string; expires: string; dueInDays: number }
export const vehicleDocs: VehicleDoc[] = [
  { reg: 'KA05K2245', doc: 'Insurance', expires: '8 Jul 2026', dueInDays: 4 },
  { reg: 'KA09H8810', doc: 'National Permit', expires: '16 Jul 2026', dueInDays: 12 },
  { reg: 'KA01C5521', doc: 'Fitness Certificate', expires: '30 Jul 2026', dueInDays: 26 },
  { reg: 'KA02D9930', doc: 'Insurance', expires: '14 Aug 2026', dueInDays: 41 },
  { reg: 'KA01C5521', doc: 'Insurance', expires: '2 Sep 2026', dueInDays: 60 },
  { reg: 'KA51F1207', doc: 'PUC', expires: '19 Jul 2026', dueInDays: 15 },
  { reg: 'KA03P7782', doc: 'Road Tax', expires: '28 Sep 2026', dueInDays: 86 },
  { reg: 'KA09H8810', doc: 'Fitness Certificate', expires: '1 Jul 2026', dueInDays: -3 },
  { reg: 'KA02D9930', doc: 'National Permit', expires: '11 Nov 2026', dueInDays: 130 },
  { reg: 'KA05K2245', doc: 'PUC', expires: '22 Jul 2026', dueInDays: 18 },
];

export type StaffRole = 'manager' | 'supervisor' | 'accountant';
export interface Staff { id: string; name: string; role: StaffRole; phone: string; since: string; scope: string }
// Demo staff removed — real people live in orgMembers (Team & Roles).

export type PayStatus = 'paid' | 'due';
export interface PayrollLine {
  id: string; name: string; role: string; basePaise: number; bhattaPaise: number; deductionsPaise: number; netPaise: number; status: PayStatus;
}
// Demo payroll removed.
