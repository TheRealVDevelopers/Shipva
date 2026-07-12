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
  id: string; name: string; phone: string; vehicleReg: string; vehicleType: VehicleType;
  dutyStatus: DutyStatus; kycStatus: KycStatus; ratingAvg: number; tripsToday: number;
  /** Compliance documents — empty/undefined = not provided. */
  aadhaar?: string; licenseNo?: string; licenseExpiry?: string;
  /** Uploaded document images (compressed data-URLs; real storage with backend). */
  aadhaarImg?: string | undefined; licenseImg?: string | undefined;
}
export const fleetDrivers: FleetDriver[] = [
  { id: 'fd1', name: 'Ramesh Yadav', phone: '+91 99020 51001', vehicleReg: 'KA01C5521', vehicleType: 'truck', dutyStatus: 'on_job', kycStatus: 'verified', ratingAvg: 4.7, tripsToday: 2, aadhaar: '4821 7745 9012', licenseNo: 'KA0120200012345', licenseExpiry: '14 Aug 2031' },
  { id: 'fd2', name: 'Sathish Reddy', phone: '+91 99020 51002', vehicleReg: 'KA02D9930', vehicleType: 'pickup', dutyStatus: 'online', kycStatus: 'verified', ratingAvg: 4.5, tripsToday: 3, aadhaar: '7712 3390 1188', licenseNo: 'KA0220190098765', licenseExpiry: '02 Mar 2029' },
  { id: 'fd3', name: 'Naveen Kumar', phone: '+91 99020 51003', vehicleReg: 'KA51F1207', vehicleType: 'tempo', dutyStatus: 'online', kycStatus: 'verified', ratingAvg: 4.8, tripsToday: 1, aadhaar: '5590 2211 8834', licenseNo: 'KA5120210044556', licenseExpiry: '19 Nov 2030' },
  { id: 'fd4', name: 'Iqbal Sharief', phone: '+91 99020 51004', vehicleReg: 'KA09H8810', vehicleType: 'truck', dutyStatus: 'on_job', kycStatus: 'verified', ratingAvg: 4.4, tripsToday: 1, aadhaar: '3321 9087 4455' },
  { id: 'fd5', name: 'Babu Rao', phone: '+91 99020 51005', vehicleReg: 'KA05K2245', vehicleType: 'mini_truck', dutyStatus: 'offline', kycStatus: 'pending', ratingAvg: 0, tripsToday: 0 },
  { id: 'fd6', name: 'Lokesh M', phone: '+91 99020 51006', vehicleReg: 'KA03P7782', vehicleType: 'tempo', dutyStatus: 'online', kycStatus: 'verified', ratingAvg: 4.6, tripsToday: 4, licenseNo: 'KA0320200077889', licenseExpiry: '08 Jul 2028' },
];

export interface Truck {
  id: string; reg: string; type: VehicleType; capacityKg: number; status: 'available' | 'on_trip' | 'maintenance'; docsOk: boolean;
  /** Compliance documents — empty/undefined = not submitted. */
  rc?: string; insuranceNo?: string; insuranceExpiry?: string; fitnessNo?: string; fitnessExpiry?: string;
  /** Uploaded document images (compressed data-URLs; real storage with backend). */
  rcImg?: string | undefined; insuranceImg?: string | undefined; fitnessImg?: string | undefined;
}
export const trucks: Truck[] = [
  { id: 't1', reg: 'KA01C5521', type: 'truck', capacityKg: 7000, status: 'on_trip', docsOk: true, rc: 'RC-KA01C5521', insuranceNo: 'INS-778812', insuranceExpiry: '02 Sep 2026', fitnessNo: 'FIT-4521', fitnessExpiry: '30 Jul 2026' },
  { id: 't2', reg: 'KA02D9930', type: 'pickup', capacityKg: 2500, status: 'available', docsOk: true, rc: 'RC-KA02D9930', insuranceNo: 'INS-556677', insuranceExpiry: '14 Aug 2026', fitnessNo: 'FIT-2210', fitnessExpiry: '21 Dec 2026' },
  { id: 't3', reg: 'KA51F1207', type: 'tempo', capacityKg: 1500, status: 'available', docsOk: true, rc: 'RC-KA51F1207', insuranceNo: 'INS-334455', insuranceExpiry: '11 Jan 2027', fitnessNo: 'FIT-9087', fitnessExpiry: '19 Jul 2026' },
  { id: 't4', reg: 'KA09H8810', type: 'truck', capacityKg: 7000, status: 'on_trip', docsOk: false, rc: 'RC-KA09H8810', insuranceNo: 'INS-221100', insuranceExpiry: '16 Jul 2026' },
  { id: 't5', reg: 'KA05K2245', type: 'mini_truck', capacityKg: 850, status: 'maintenance', docsOk: false, rc: 'RC-KA05K2245' },
];

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

export const payouts = [
  { id: 'PO-204', period: '16–22 Jun', amountPaise: 4820000, status: 'settled', on: '23 Jun' },
  { id: 'PO-198', period: '9–15 Jun', amountPaise: 5140000, status: 'settled', on: '16 Jun' },
  { id: 'PO-191', period: '2–8 Jun', amountPaise: 3960000, status: 'settled', on: '9 Jun' },
];

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
export interface Trip {
  lr: string; date: string; from: string; to: string; driver: string; vehicleReg: string;
  material: string; weightKg: number; freightPaise: number; status: TripStatus; ewayBill: boolean;
}
export const trips: Trip[] = [
  { lr: 'LR-24817', date: '27 Jun', from: 'Peenya', to: 'Hosur', driver: 'Ramesh Yadav', vehicleReg: 'KA01C5521', material: 'Steel coils', weightKg: 6800, freightPaise: 3400000, status: 'in_transit', ewayBill: true },
  { lr: 'LR-24816', date: '27 Jun', from: 'Whitefield', to: 'KR Puram', driver: 'Iqbal Sharief', vehicleReg: 'KA09H8810', material: 'Electronics', weightKg: 2400, freightPaise: 1500000, status: 'loading', ewayBill: true },
  { lr: 'LR-24814', date: '26 Jun', from: 'Bengaluru', to: 'Chennai', driver: 'Sathish Reddy', vehicleReg: 'KA02D9930', material: 'Polymer granules', weightKg: 2200, freightPaise: 4400000, status: 'at_drop', ewayBill: true },
  { lr: 'LR-24811', date: '26 Jun', from: 'Peenya', to: 'Yelahanka', driver: 'Lokesh M', vehicleReg: 'KA03P7782', material: 'FMCG cartons', weightKg: 1400, freightPaise: 1200000, status: 'pod_pending', ewayBill: false },
  { lr: 'LR-24805', date: '25 Jun', from: 'Bengaluru', to: 'Hyderabad', driver: 'Iqbal Sharief', vehicleReg: 'KA09H8810', material: 'Machinery', weightKg: 6500, freightPaise: 5800000, status: 'closed', ewayBill: true },
  { lr: 'LR-24802', date: '24 Jun', from: 'Whitefield', to: 'Mysuru', driver: 'Naveen Kumar', vehicleReg: 'KA51F1207', material: 'Textiles', weightKg: 1500, freightPaise: 1900000, status: 'closed', ewayBill: true },
];

export type InvoiceStatus = 'paid' | 'pending' | 'overdue';
export interface Invoice {
  no: string; client: string; date: string; dueDate: string;
  basePaise: number; gstPaise: number; totalPaise: number; status: InvoiceStatus;
}
export const invoices: Invoice[] = [
  { no: 'INV-1042', client: 'Bharat Steels', date: '26 Jun', dueDate: '11 Jul', basePaise: 3400000, gstPaise: 612000, totalPaise: 4012000, status: 'pending' },
  { no: 'INV-1041', client: 'Vexa Polymers', date: '25 Jun', dueDate: '10 Jul', basePaise: 4400000, gstPaise: 792000, totalPaise: 5192000, status: 'pending' },
  { no: 'INV-1038', client: 'FreshCo Dairy', date: '22 Jun', dueDate: '7 Jul', basePaise: 5800000, gstPaise: 1044000, totalPaise: 6844000, status: 'paid' },
  { no: 'INV-1035', client: 'Leela Stores', date: '18 Jun', dueDate: '3 Jul', basePaise: 1200000, gstPaise: 216000, totalPaise: 1416000, status: 'overdue' },
  { no: 'INV-1030', client: 'Deccan Freight', date: '12 Jun', dueDate: '27 Jun', basePaise: 1900000, gstPaise: 342000, totalPaise: 2242000, status: 'overdue' },
  { no: 'INV-1028', client: 'Bharat Steels', date: '10 Jun', dueDate: '25 Jun', basePaise: 2800000, gstPaise: 504000, totalPaise: 3304000, status: 'paid' },
];

export interface Expense { date: string; tripLr: string; category: string; amountPaise: number; note: string }
export const expenses: Expense[] = [
  { date: '27 Jun', tripLr: 'LR-24817', category: 'Toll', amountPaise: 42000, note: 'NICE Road + Hosur' },
  { date: '27 Jun', tripLr: 'LR-24817', category: 'Loading', amountPaise: 25000, note: 'Peenya hamali' },
  { date: '26 Jun', tripLr: 'LR-24814', category: 'Toll', amountPaise: 118000, note: 'BLR–Chennai NH' },
  { date: '26 Jun', tripLr: 'LR-24811', category: 'RTO/Police', amountPaise: 15000, note: 'Checkpost' },
  { date: '25 Jun', tripLr: 'LR-24805', category: 'Repairs', amountPaise: 86000, note: 'Tyre replacement' },
  { date: '24 Jun', tripLr: 'LR-24802', category: 'Misc', amountPaise: 12000, note: 'Driver bhatta top-up' },
];

export interface FuelLog {
  date: string; reg: string; km: number; litres: number; ratePaise: number; costPaise: number; expectedPaise: number; ok: boolean;
}
export const fuelLogs: FuelLog[] = [
  { date: '27 Jun', reg: 'KA01C5521', km: 96, litres: 34, ratePaise: 9200, costPaise: 312800, expectedPaise: 294400, ok: true },
  { date: '26 Jun', reg: 'KA02D9930', km: 348, litres: 41, ratePaise: 9200, costPaise: 377200, expectedPaise: 358800, ok: true },
  { date: '25 Jun', reg: 'KA09H8810', km: 575, litres: 82, ratePaise: 9200, costPaise: 754400, expectedPaise: 644000, ok: false },
  { date: '24 Jun', reg: 'KA51F1207', km: 142, litres: 20, ratePaise: 9200, costPaise: 184000, expectedPaise: 174800, ok: true },
];

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
export const staff: Staff[] = [
  { id: 's1', name: 'Prakash Nayak', role: 'manager', phone: '+91 99011 22001', since: 'Jan 2025', scope: 'All operations' },
  { id: 's2', name: 'Sunil D.', role: 'supervisor', phone: '+91 99011 22002', since: 'Mar 2025', scope: 'Peenya pool' },
  { id: 's3', name: 'Farhan A.', role: 'supervisor', phone: '+91 99011 22003', since: 'Jun 2025', scope: 'Hosur pool' },
  { id: 's4', name: 'Lakshmi R.', role: 'accountant', phone: '+91 99011 22004', since: 'Feb 2025', scope: 'Billing & payroll' },
];

export type PayStatus = 'paid' | 'due';
export interface PayrollLine {
  id: string; name: string; role: string; basePaise: number; bhattaPaise: number; deductionsPaise: number; netPaise: number; status: PayStatus;
}
export const payroll: PayrollLine[] = [
  { id: 'p1', name: 'Ramesh Yadav', role: 'Driver', basePaise: 1800000, bhattaPaise: 620000, deductionsPaise: 150000, netPaise: 2270000, status: 'due' },
  { id: 'p2', name: 'Sathish Reddy', role: 'Driver', basePaise: 1800000, bhattaPaise: 540000, deductionsPaise: 90000, netPaise: 2250000, status: 'due' },
  { id: 'p3', name: 'Naveen Kumar', role: 'Driver', basePaise: 1700000, bhattaPaise: 480000, deductionsPaise: 60000, netPaise: 2120000, status: 'paid' },
  { id: 'p4', name: 'Sunil D.', role: 'Supervisor', basePaise: 2600000, bhattaPaise: 0, deductionsPaise: 120000, netPaise: 2480000, status: 'due' },
  { id: 'p5', name: 'Lakshmi R.', role: 'Accountant', basePaise: 2400000, bhattaPaise: 0, deductionsPaise: 110000, netPaise: 2290000, status: 'paid' },
];
