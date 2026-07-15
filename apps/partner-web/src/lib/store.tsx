/**
 * Partner data store — the single source of truth for the Transporter OS UI.
 *
 * Phase A: backed by localStorage so records created in the UI persist across
 * refresh. The component API (useStore) is deliberately backend-agnostic — in
 * Phase B the implementation swaps to Firestore (scoped per transporter tenant)
 * without changing any page that consumes it.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  invoices as seedInvoices, expenses as seedExpenses,
  fuelLogs as seedFuelLogs, fleetDrivers as seedDrivers, trucks as seedTrucks,
  payroll as seedPayroll, staff as seedStaff,
  type Trip, type Invoice, type Expense, type FuelLog, type FleetDriver, type Truck,
  type PayrollLine, type Staff, type TripStatus,
} from './mocks.js';
import { tripSteps, statusFromStep } from './trip.js';
import { watchTrips, addTripDoc, updateTripDoc, seedTripsFor } from './trips.js';
import { watchToursFs, addTourDoc, updateTourDoc } from './tours.js';
import { customersCol, driversCol, trucksCol, ownersCol } from './common.js';
import { useAuth } from './auth.js';

/** Vendor agreement — absence means "not created yet". */
export interface Agreement {
  createdOn: string;
  effectiveFrom: string;
  durationMonths: number;
  ratePerKmPaise?: number;
  commissionPct?: number;
  notes?: string;
}

/** How far a transporter has got through onboarding. Mirrors the client's own
 *  documents: capture details, issue the 7-day Letter of Intent, run the trial,
 *  sign the Service Agreement before day 8 — only then are they onboarded.
 *  A transporter can't be put on a trip until they're `active`. */
export type OnboardStage = 'draft' | 'trial' | 'agreement_pending' | 'active' | 'rejected';

export type EntityType = 'proprietorship' | 'partnership' | 'pvt_ltd' | 'llp' | 'other';

/**
 * A transporter (the app calls them customers internally; the UI says
 * "Transporter"). The field set is driven by what the two agreements actually
 * demand — the Service Agreement's party block wants legal name, entity type,
 * GSTIN/PAN and registered address; clause 5.5 needs a GSTIN to raise a
 * GST-compliant invoice; 5.8 needs a PAN for TDS; clause 17 needs a notices
 * address + email; the signature block needs an authorised signatory; and
 * Annexure B is the rate contract.
 */
export interface Customer {
  id: string;
  /** Legal entity name — the "OWNER" in the Service Agreement party block. */
  name: string;
  entityType?: EntityType;
  /** GSTIN, or Aadhaar instead when the vendor isn't GST-registered. */
  gstin: string;
  pan?: string;
  aadhaar?: string;
  /** Contact — the LOI is addressed to this person. */
  contactName?: string;
  phone: string;
  /** Secondary phone — one of only two fields the client allows to be optional. */
  phone2?: string;
  email?: string;
  /** Registered / office address (agreement party block + clause 17 notices). */
  addressLine1?: string;
  /** Address line 2 — the other field the client allows to be optional. */
  addressLine2?: string;
  city: string;
  state?: string;
  pincode?: string;
  /** Payment details — how the monthly vendor payout actually goes out. */
  bankAccountName?: string;
  bankAccountNo?: string;
  bankIfsc?: string;
  bankName?: string;
  upiId?: string;
  /** Who signs for them (agreement signature block). */
  signatoryName?: string;
  signatoryTitle?: string;
  /** Rate contract — Annexure B of the Service Agreement. */
  ratePerKmPaise: number;
  monthlyCostPaise?: number;
  extraKmPaise?: number;
  avgMonthlyKm?: number;
  vehicleType?: string;
  /** Onboarding progress. Absent on records that predate onboarding — those are
   *  grandfathered as `active` (see stageOf), since they're already trading. */
  stage?: OnboardStage;
  trialStart?: string;
  trialEnd?: string;
  loiIssuedOn?: string;
  agreementApprovedOn?: string;
  agreementApprovedBy?: string;
  outstandingPaise: number;
  agreement?: Agreement;
}

/** Records created before onboarding existed have no stage — they're live
 *  customers with outstanding invoices, so treat them as already onboarded
 *  rather than suddenly blocking trips for them. */
export const stageOf = (c: Customer): OnboardStage => c.stage ?? 'active';

export const STAGE_LABEL: Record<OnboardStage, string> = {
  draft: 'Draft — details captured',
  trial: 'Trial (7-day LOI)',
  agreement_pending: 'Agreement pending',
  active: 'Onboarded',
  rejected: 'Rejected',
};
const seedCustomers: Customer[] = [
  { id: 'c1', name: 'Bharat Steels', gstin: '29AABCB1111C1Z9', phone: '+91 98450 10001', city: 'Hosur', ratePerKmPaise: 4200, outstandingPaise: 1180000, agreement: { createdOn: '12 Jun 2026', effectiveFrom: '01 Jun 2026', durationMonths: 12, ratePerKmPaise: 4200 } },
  { id: 'c2', name: 'Vexa Polymers', gstin: '29AACCV2222D1Z8', phone: '+91 98450 10002', city: 'Chennai', ratePerKmPaise: 3800, outstandingPaise: 1357000 },
  { id: 'c3', name: 'FreshCo Dairy', gstin: '36AADCF3333E1Z7', phone: '+91 98450 10003', city: 'Hyderabad', ratePerKmPaise: 5100, outstandingPaise: 0 },
  { id: 'c4', name: 'Leela Stores', gstin: '29AAECL4444F1Z6', phone: '+91 98450 10004', city: 'Bengaluru', ratePerKmPaise: 3200, outstandingPaise: 113280 },
];

/** Whether an owner's identity documents have been checked. Separate from
 *  `stage`: KYC is "are these papers real", stage is "have they signed". */
export type KycState = 'pending' | 'verified' | 'rejected';

/**
 * An attached (market) truck owner. The client wants the owner and the
 * transporter kept apart — a vehicle owner often operates under someone else's
 * transport company, and the two names were previously conflated into one
 * field. `owner` stays the owner's own name (so existing records keep working);
 * `transporterName` is the company they run under, when different.
 */
export interface AttachedTruck {
  id: string;
  /** The person/entity who owns the vehicle. */
  owner: string;
  /** The transport company they operate under — blank when they're independent. */
  transporterName?: string;
  reg: string;
  phone: string;
  /** Second contact number — owners commonly give two. */
  phone2?: string;
  /** KYC — identity papers. GSTIN is optional (many owner-drivers have none). */
  pan?: string;
  aadhaar?: string;
  gstin?: string;
  kycStatus?: KycState;
  kycVerifiedBy?: string;
  kycVerifiedOn?: string;
  /** Address. */
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  /** Payment details — how their balance actually gets paid out. */
  bankAccountName?: string;
  bankAccountNo?: string;
  bankIfsc?: string;
  bankName?: string;
  upiId?: string;
  /** Same onboarding ladder as a transporter: 7-day letter, then the agreement. */
  stage?: OnboardStage;
  trialStart?: string;
  trialEnd?: string;
  loiIssuedOn?: string;
  agreementApprovedOn?: string;
  agreementApprovedBy?: string;
  balancePaise: number;
  trips: number;
  agreement?: Agreement;
}

/** Owners created before onboarding existed are already trading — grandfather
 *  them as onboarded rather than freezing their ledger. */
export const ownerStageOf = (a: AttachedTruck): OnboardStage => a.stage ?? 'active';
export const kycOf = (a: AttachedTruck): KycState => a.kycStatus ?? 'pending';
const seedAttached: AttachedTruck[] = [
  { id: 'a1', owner: 'Deccan Freight', reg: 'KA25B4410', phone: '+91 90080 22001', balancePaise: 420000, trips: 6, agreement: { createdOn: '05 May 2026', effectiveFrom: '01 May 2026', durationMonths: 24, commissionPct: 8 } },
  { id: 'a2', owner: 'Sri Sai Carriers', reg: 'AP16C7788', phone: '+91 90080 22002', balancePaise: 185000, trips: 3 },
  { id: 'a3', owner: 'M. Khan (owner-driver)', reg: 'KA51D3321', phone: '+91 90080 22003', balancePaise: 0, trips: 9 },
];

/** Amazon relay tour — the client's operational trip format (maps 1:1 to their
 *  55-column tour sheet). Up to 4 facility stops per tour. */
export interface TourStop {
  name: string; amzArrival: string; kmPhoto: boolean; arrivalReport: string;
  amzDeparture: string; invoicePhoto: boolean; dispatchReport: string; km: string;
  /** Route-Assign fields: stop location + scheduled arrival/departure (datetime-local). */
  location?: string; arrivalAt?: string; departureAt?: string;
  /** Live check-in / check-out stamps (epoch ms) set as the driver moves. */
  actualArrival?: number; actualDeparture?: number;
}

/** A stop on a VRID leg. Each VRID (vehicle-run) is its own route. */
export interface TourLegStop {
  name: string; location?: string; mapUrl?: string;
  arrivalAt?: string; departureAt?: string;      // scheduled (datetime-local)
  actualArrival?: number; actualDeparture?: number; // live check-in/out (epoch ms)
}
/** One VRID and the ordered stops it runs. */
export interface TourLeg {
  vrid: string;
  loadType?: string;          // 'Load' | 'No Load' (per leg)
  stops: TourLegStop[];
}

export interface Tour {
  id: string; date: string; tourId: string; vrId: string; seTracker: string; toll: string;
  amzEquipmentType: string; seEquipmentType: string; amzStatus: string; sarvaStatus: string;
  present: string; scheduleAdhoc: string; noLoadLoad: string; advanceAmount: string; paidPending: string;
  driver: string; vehicleId: string; driverNumber: string; vendorName: string;
  stops: TourStop[]; totalManualKm: string; amazonRelyKm: string; gpsKm: string; remarks: string;
  /** All VRIDs on this route (vrId keeps the first for the legacy sheet). */
  vrIds?: string[];
  /** POC (member) who runs this line; owner/managers see all. */
  ownerUid?: string; ownerName?: string; leaderUid?: string; createdAtMs?: number;
  /** Route-Assign additions. */
  serviceAt?: string;                 // service date & time (datetime-local)
  gpayName?: string; gpayNumber?: string;
  legs?: TourLeg[];                   // per-VRID routes (source of truth for new tours)
  /** POC operational fields captured during the run. */
  invoiceGiven?: boolean;
  kmPhotoImg?: string; invoicePhotoImg?: string; gpsPhotoImg?: string;
  expenseAmount?: string; expenseNote?: string;
  /** WhatsApp share status. */
  sharedVendor?: boolean; sharedDriver?: boolean;
}

/** A remembered pickup/drop location, suggested while typing a new trip. */
export interface SavedPoint { label: string; mapUrl?: string }
const seedPoints: SavedPoint[] = [
  { label: 'Peenya', mapUrl: 'https://maps.google.com/?q=Peenya+Industrial+Area+Bengaluru' },
  { label: 'Whitefield', mapUrl: 'https://maps.google.com/?q=Whitefield+Bengaluru' },
  { label: 'Electronic City', mapUrl: 'https://maps.google.com/?q=Electronic+City+Bengaluru' },
  { label: 'JP Nagar', mapUrl: 'https://maps.google.com/?q=JP+Nagar+Bengaluru' },
  { label: 'KR Puram' }, { label: 'Yelahanka' }, { label: 'Hebbal' }, { label: 'Hosur' },
  { label: 'Bommasandra' }, { label: 'Nelamangala' },
];

/** A money/approval request a worker raises for the accountant to action. */
export interface MoneyRequest {
  id: string; createdOn: string; raisedBy: string;
  kind: 'expense' | 'advance' | 'trip' | 'other';
  title: string; note?: string; amountPaise?: number; tripLr?: string;
  status: 'pending' | 'approved' | 'rejected';
}
const seedRequests: MoneyRequest[] = [
  { id: 'rq1', createdOn: '27 Jun', raisedBy: 'Supervisor · Peenya', kind: 'advance', title: 'Driver advance — Ramesh (Hosur trip)', amountPaise: 300000, tripLr: 'LR-24817', status: 'pending', note: 'Diesel + food advance for the run.' },
  { id: 'rq2', createdOn: '26 Jun', raisedBy: 'Supervisor · Peenya', kind: 'expense', title: 'Tyre puncture repair — KA02D9930', amountPaise: 45000, status: 'pending' },
];

const seedCategories = ['Toll', 'RTO/Police', 'Loading', 'Repairs', 'Office', 'Misc'];

interface StoreShape {
  invoices: Invoice[];
  fuelLogs: FuelLog[];
  expenses: Expense[];
  payroll: PayrollLine[];
  staff: Staff[];
  savedPoints: SavedPoint[];
  expenseCategories: string[];
  requests: MoneyRequest[];
}

interface StoreApi extends StoreShape {
  /** Trips & tours are backed by Firestore and scoped to the signed-in member. */
  trips: Trip[];
  tours: Tour[];
  /** Shared reference data — Firestore-backed, common to the whole org. */
  customers: Customer[];
  drivers: FleetDriver[];
  trucks: Truck[];
  attached: AttachedTruck[];
  addTrip: (t: Omit<Trip, 'lr' | 'vrId' | 'id'>, handledBy?: { uid: string; name: string; leaderUid?: string }) => void;
  updateTripStatus: (id: string, status: TripStatus) => void;
  /** Advance a trip one step along its live timeline; pass a remark when finishing. */
  advanceTrip: (id: string, remark?: string) => void;
  addSavedPoint: (p: SavedPoint) => void;
  addInvoice: (i: Omit<Invoice, 'no' | 'gstPaise' | 'totalPaise'> & { gstRate?: number }) => void;
  markInvoicePaid: (no: string) => void;
  addExpense: (e: Expense) => void;
  addFuelLog: (f: FuelLog) => void;
  addExpenseCategory: (name: string) => void;
  addRequest: (r: Omit<MoneyRequest, 'id' | 'createdOn' | 'status'>) => void;
  resolveRequest: (id: string, status: 'approved' | 'rejected') => void;
  addCustomer: (c: Omit<Customer, 'id' | 'outstandingPaise'>) => void;
  addDriver: (d: Omit<FleetDriver, 'id'>) => void;
  addTruck: (t: Omit<Truck, 'id'>) => void;
  setDriverDocs: (id: string, docs: Pick<FleetDriver, 'aadhaar' | 'licenseNo' | 'licenseExpiry' | 'pan' | 'aadhaarImg' | 'licenseImg' | 'panImg'>) => void;
  setTruckDocs: (id: string, docs: Pick<Truck, 'rc' | 'insuranceNo' | 'insuranceExpiry' | 'fitnessNo' | 'fitnessExpiry' | 'rcImg' | 'insuranceImg' | 'fitnessImg'>) => void;
  /** Edit / remove fleet records (delete is owner-manager only, per rules). */
  updateDriver: (id: string, patch: Partial<FleetDriver>) => void;
  updateTruck: (id: string, patch: Partial<Truck>) => void;
  deleteDriver: (id: string) => void;
  deleteTruck: (id: string) => void;
  setCustomerAgreement: (id: string, a: Agreement) => void;
  setAttachedAgreement: (id: string, a: Agreement) => void;
  /** Edit a transporter / advance them through onboarding. */
  updateCustomer: (id: string, patch: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  /** Edit a truck owner / advance their onboarding & KYC. */
  updateAttached: (id: string, patch: Partial<AttachedTruck>) => void;
  deleteAttached: (id: string) => void;
  addStaff: (s: Omit<Staff, 'id'>) => void;
  addAttached: (a: Omit<AttachedTruck, 'id'>) => void;
  recordOwnerPayment: (id: string, amountPaise: number) => void;
  addTour: (t: Omit<Tour, 'id'>, handledBy?: { uid: string; name: string; leaderUid?: string }) => void;
  updateTour: (id: string, patch: Partial<Tour>) => void;
  runPayroll: () => void;
  reset: () => void;
}

const KEY = 'shipva-partner-store-v2';

function seed(): StoreShape {
  return {
    invoices: seedInvoices, expenses: seedExpenses, fuelLogs: seedFuelLogs,
    payroll: seedPayroll, staff: seedStaff, savedPoints: seedPoints,
    expenseCategories: seedCategories, requests: seedRequests,
  };
}

function load(): StoreShape {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      // Reference data (customers/drivers/trucks/owners) now lives in Firestore —
      // don't carry it in the local blob any more.
      delete parsed.customers; delete parsed.drivers; delete parsed.trucks; delete parsed.attached;
      return { ...seed(), ...parsed } as StoreShape;
    }
  } catch { /* ignore corrupt cache */ }
  return seed();
}

/** The org's reference data as it last existed on THIS device (the owner's local
 *  additions plus the demo seed). Used exactly once to migrate into the shared
 *  Firestore collections so nothing the owner already entered disappears. */
function readLegacyRefData(): { customers: Customer[]; drivers: FleetDriver[]; trucks: Truck[]; attached: AttachedTruck[] } {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const j = JSON.parse(raw) as Partial<{ customers: Customer[]; drivers: FleetDriver[]; trucks: Truck[]; attached: AttachedTruck[] }>;
      return {
        customers: j.customers?.length ? j.customers : seedCustomers,
        drivers: j.drivers?.length ? j.drivers : seedDrivers,
        trucks: j.trucks?.length ? j.trucks : seedTrucks,
        attached: j.attached?.length ? j.attached : seedAttached,
      };
    }
  } catch { /* fall through to seed */ }
  return { customers: seedCustomers, drivers: seedDrivers, trucks: seedTrucks, attached: seedAttached };
}

const Ctx = createContext<StoreApi | null>(null);

let counter = 0;
const uid = () => `${Date.now().toString(36)}${(counter++).toString(36)}`;
const today = () => new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<StoreShape>(load);
  const { member } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const tripsRef = useRef<Trip[]>([]);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* quota */ }
  }, [s]);

  // Trips live in Firestore, scoped to the signed-in member (supervisors see
  // only their own; owner/managers see all). One-time demo seed for the owner.
  useEffect(() => {
    if (!member) { setTrips([]); tripsRef.current = []; return; }
    const scope = { uid: member.uid, role: member.role, leaderUid: member.leaderUid || member.uid };
    let seeded = false;
    return watchTrips(scope, (list) => {
      setTrips(list);
      tripsRef.current = list;
      if (!seeded && list.length === 0 && member.role === 'owner' && !localStorage.getItem('trips-seeded-v1')) {
        seeded = true;
        localStorage.setItem('trips-seeded-v1', '1');
        void seedTripsFor(scope);
      }
    });
  }, [member?.uid, member?.role]);

  // Tours (Amazon routes) — Firestore-backed with the same POC scoping.
  const [tours, setTours] = useState<Tour[]>([]);
  useEffect(() => {
    if (!member) { setTours([]); return; }
    return watchToursFs({ uid: member.uid, role: member.role, leaderUid: member.leaderUid || member.uid }, setTours);
  }, [member?.uid, member?.role, member?.leaderUid]);

  const addTour = useCallback((t: Omit<Tour, 'id'>, handledBy?: { uid: string; name: string; leaderUid?: string }) => {
    if (!member) return;
    void addTourDoc(t, { uid: member.uid, role: member.role, leaderUid: member.leaderUid || member.uid }, handledBy);
  }, [member?.uid, member?.role, member?.leaderUid]);

  const updateTour = useCallback((id: string, patch: Partial<Tour>) => {
    void updateTourDoc(id, patch);
  }, []);

  // ── Shared reference data (customers / drivers / trucks / truck owners) ──────
  // Firestore-backed and common to the whole org — everyone reads the same lists
  // and any add shows up for the rest of the team. On the owner's first run we
  // migrate whatever was in local storage (their additions + the demo seed) into
  // the shared collections, exactly once (guarded by the empty-collection check
  // plus a per-collection localStorage flag).
  const legacyRef = useRef(readLegacyRefData());
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [drivers, setDrivers] = useState<FleetDriver[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [attached, setAttached] = useState<AttachedTruck[]>([]);
  const attachedRef = useRef<AttachedTruck[]>([]);

  useEffect(() => {
    if (!member) {
      setCustomers([]); setDrivers([]); setTrucks([]); setAttached([]); attachedRef.current = [];
      return;
    }
    const isOwner = member.role === 'owner';
    const legacy = legacyRef.current;
    const seedOnce = (flag: string, empty: boolean, run: () => Promise<void>) => {
      if (isOwner && empty && !localStorage.getItem(flag)) {
        localStorage.setItem(flag, '1');
        void run();
      }
    };
    const unsubs = [
      customersCol.watch((l) => { setCustomers(l); seedOnce('ref-customers-seeded-v1', l.length === 0, () => customersCol.seed(legacy.customers)); }),
      driversCol.watch((l) => { setDrivers(l); seedOnce('ref-drivers-seeded-v1', l.length === 0, () => driversCol.seed(legacy.drivers)); }),
      trucksCol.watch((l) => { setTrucks(l); seedOnce('ref-trucks-seeded-v1', l.length === 0, () => trucksCol.seed(legacy.trucks)); }),
      ownersCol.watch((l) => { setAttached(l); attachedRef.current = l; seedOnce('ref-owners-seeded-v1', l.length === 0, () => ownersCol.seed(legacy.attached)); }),
    ];
    return () => unsubs.forEach((u) => u());
  }, [member?.uid, member?.role]);

  const addTrip = useCallback((t: Omit<Trip, 'lr' | 'vrId' | 'id'>, handledBy?: { uid: string; name: string; leaderUid?: string }) => {
    if (!member) return;
    void addTripDoc(t, { uid: member.uid, role: member.role, leaderUid: member.leaderUid || member.uid }, handledBy);
  }, [member?.uid, member?.role, member?.leaderUid]);

  const updateTripStatus = useCallback((id: string, status: TripStatus) => {
    void updateTripDoc(id, { status });
  }, []);

  const advanceTrip = useCallback((id: string, remark?: string) => {
    const t = tripsRef.current.find((x) => x.id === id);
    if (!t) return;
    const steps = tripSteps(t);
    const next = Math.min((t.stepIndex ?? 0) + 1, steps.length - 1);
    void updateTripDoc(id, {
      stepIndex: next, status: statusFromStep(steps, next),
      ...(remark !== undefined ? { remark } : {}),
    });
  }, []);

  const addSavedPoint = useCallback((sp: SavedPoint) => {
    const label = sp.label.trim();
    if (!label) return;
    setS((p) => {
      const i = p.savedPoints.findIndex((x) => x.label.toLowerCase() === label.toLowerCase());
      if (i === -1) return { ...p, savedPoints: [{ ...sp, label }, ...p.savedPoints] };
      // Known point — fill in a map link if we now have one.
      if (sp.mapUrl && !p.savedPoints[i]!.mapUrl) {
        const copy = [...p.savedPoints];
        copy[i] = { ...copy[i]!, mapUrl: sp.mapUrl };
        return { ...p, savedPoints: copy };
      }
      return p;
    });
  }, []);

  const addInvoice = useCallback((i: Omit<Invoice, 'no' | 'gstPaise' | 'totalPaise'> & { gstRate?: number }) => {
    setS((p) => {
      const gst = Math.round(i.basePaise * ((i.gstRate ?? 18) / 100));
      const inv: Invoice = {
        no: `INV-${1043 + p.invoices.length}`, client: i.client, date: i.date, dueDate: i.dueDate,
        basePaise: i.basePaise, gstPaise: gst, totalPaise: i.basePaise + gst, status: i.status,
      };
      return { ...p, invoices: [inv, ...p.invoices] };
    });
  }, []);

  const markInvoicePaid = useCallback((no: string) => {
    setS((p) => ({ ...p, invoices: p.invoices.map((i) => (i.no === no ? { ...i, status: 'paid' } : i)) }));
  }, []);

  const addExpense = useCallback((e: Expense) => setS((p) => ({ ...p, expenses: [e, ...p.expenses] })), []);
  const addFuelLog = useCallback((f: FuelLog) => setS((p) => ({ ...p, fuelLogs: [f, ...p.fuelLogs] })), []);

  const addExpenseCategory = useCallback((name: string) => {
    const n = name.trim();
    if (!n) return;
    setS((p) => (p.expenseCategories.some((c) => c.toLowerCase() === n.toLowerCase())
      ? p : { ...p, expenseCategories: [...p.expenseCategories, n] }));
  }, []);

  const addRequest = useCallback((r: Omit<MoneyRequest, 'id' | 'createdOn' | 'status'>) => {
    setS((p) => ({ ...p, requests: [{ ...r, id: uid(), createdOn: today(), status: 'pending' }, ...p.requests] }));
  }, []);

  const resolveRequest = useCallback((id: string, status: 'approved' | 'rejected') => {
    setS((p) => ({ ...p, requests: p.requests.map((r) => (r.id === id ? { ...r, status } : r)) }));
  }, []);

  // Reference-data writes go straight to the shared Firestore collections; the
  // live snapshot listeners above update every member's view.
  const addCustomer = useCallback((c: Omit<Customer, 'id' | 'outstandingPaise'>) => {
    void customersCol.add({ ...c, outstandingPaise: 0 });
  }, []);

  const addDriver = useCallback((d: Omit<FleetDriver, 'id'>) => {
    void driversCol.add(d);
  }, []);

  const addTruck = useCallback((t: Omit<Truck, 'id'>) => {
    void trucksCol.add(t);
  }, []);

  const setDriverDocs = useCallback((id: string, docs: Pick<FleetDriver, 'aadhaar' | 'licenseNo' | 'licenseExpiry' | 'pan' | 'aadhaarImg' | 'licenseImg' | 'panImg'>) => {
    void driversCol.update(id, docs);
  }, []);

  const setTruckDocs = useCallback((id: string, docs: Pick<Truck, 'rc' | 'insuranceNo' | 'insuranceExpiry' | 'fitnessNo' | 'fitnessExpiry' | 'rcImg' | 'insuranceImg' | 'fitnessImg'>) => {
    void trucksCol.update(id, docs);
  }, []);

  const updateDriver = useCallback((id: string, patch: Partial<FleetDriver>) => { void driversCol.update(id, patch); }, []);
  const updateTruck = useCallback((id: string, patch: Partial<Truck>) => { void trucksCol.update(id, patch); }, []);
  const deleteDriver = useCallback((id: string) => { void driversCol.remove(id); }, []);
  const deleteTruck = useCallback((id: string) => { void trucksCol.remove(id); }, []);

  const setCustomerAgreement = useCallback((id: string, a: Agreement) => {
    void customersCol.update(id, { agreement: a });
  }, []);

  const updateCustomer = useCallback((id: string, patch: Partial<Customer>) => { void customersCol.update(id, patch); }, []);
  const deleteCustomer = useCallback((id: string) => { void customersCol.remove(id); }, []);
  const updateAttached = useCallback((id: string, patch: Partial<AttachedTruck>) => { void ownersCol.update(id, patch); }, []);
  const deleteAttached = useCallback((id: string) => { void ownersCol.remove(id); }, []);

  const setAttachedAgreement = useCallback((id: string, a: Agreement) => {
    void ownersCol.update(id, { agreement: a });
  }, []);

  const addStaff = useCallback((st: Omit<Staff, 'id'>) => {
    setS((p) => ({ ...p, staff: [{ ...st, id: uid() }, ...p.staff] }));
  }, []);

  const recordOwnerPayment = useCallback((id: string, amountPaise: number) => {
    const o = attachedRef.current.find((x) => x.id === id);
    if (!o) return;
    void ownersCol.update(id, { balancePaise: Math.max(0, o.balancePaise - amountPaise) });
  }, []);

  const addAttached = useCallback((a: Omit<AttachedTruck, 'id'>) => {
    void ownersCol.add(a);
  }, []);

  const runPayroll = useCallback(() => {
    setS((p) => ({ ...p, payroll: p.payroll.map((l) => ({ ...l, status: 'paid' })) }));
  }, []);

  const reset = useCallback(() => setS(seed()), []);

  const value = useMemo<StoreApi>(() => ({
    ...s, trips, tours, customers, drivers, trucks, attached,
    addTrip, updateTripStatus, advanceTrip, addSavedPoint, addInvoice, markInvoicePaid, addExpense, addFuelLog,
    addExpenseCategory, addRequest, resolveRequest, addCustomer, addDriver, addTruck,
    setDriverDocs, setTruckDocs, updateDriver, updateTruck, deleteDriver, deleteTruck,
    setCustomerAgreement, setAttachedAgreement, updateCustomer, deleteCustomer, updateAttached, deleteAttached,
    addStaff, addAttached, recordOwnerPayment, addTour, updateTour, runPayroll, reset,
  }), [s, trips, tours, customers, drivers, trucks, attached,
    addTrip, updateTripStatus, advanceTrip, addSavedPoint, addInvoice, markInvoicePaid, addExpense, addFuelLog,
    addExpenseCategory, addRequest, resolveRequest, addCustomer, addDriver, addTruck,
    setDriverDocs, setTruckDocs, updateDriver, updateTruck, deleteDriver, deleteTruck,
    setCustomerAgreement, setAttachedAgreement, updateCustomer, deleteCustomer, updateAttached, deleteAttached,
    addStaff, addAttached, recordOwnerPayment, addTour, updateTour, runPayroll, reset]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be used inside <StoreProvider>');
  return v;
}

export { today as todayLabel };
