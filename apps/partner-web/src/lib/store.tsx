/**
 * Partner data store — the single source of truth for the Transporter OS UI.
 *
 * The operational and money data now lives in Firestore: trips & tours are
 * scoped to the signed-in member; reference data (customers/drivers/trucks/
 * owners) and money (invoices/expenses/fuel/payroll/requests) are shared across
 * the whole org. Only lightweight per-device config — saved trip points, the
 * expense-category list and legacy staff — still rides in localStorage. The
 * component API (useStore) stays backend-agnostic: a page reads `invoices` the
 * same way whether it came from a blob or a snapshot listener.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type {
  Trip, Invoice, Expense, FuelLog, FleetDriver, Truck, PayrollLine, Staff, TripStatus,
} from './mocks.js';
import { tripSteps, statusFromStep } from './trip.js';
import { watchTrips, addTripDoc, updateTripDoc, deleteTripDoc } from './trips.js';
import { watchToursFs, addTourDoc, updateTourDoc, deleteTourDoc } from './tours.js';
import { customersCol, driversCol, trucksCol, ownersCol } from './common.js';
import { invoicesCol, expensesCol, fuelLogsCol, payrollCol, requestsCol } from './money.js';
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

/**
 * A reported delay against one VRID's arrival or departure. Append-only — the
 * client asked for an audit log, so a correction is another entry rather than an
 * edit of the last one. Lives on the run itself so it travels with it.
 */
export interface DelayReport {
  id: string;
  /** Which VRID the delay is on. */
  vrid: string;
  /** What slipped, e.g. "HKR3 arrival" / "TBK2 departure". */
  event: string;
  /** Reason code, chosen from the admin's list. */
  reason: string;
  /** The time it was meant to happen (as scheduled), for the record. */
  scheduledAt: string;
  /** The new estimate. */
  estimatedAt: string;
  byName: string;
  atMs: number;
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
  /** Manual odometer readings. The client wants the total derived, not typed —
   *  `totalManualKm` is kept as the stored figure (the sheet exports it) but is
   *  computed as endKm − startKm whenever both are present. */
  startKm?: string;
  endKm?: string;
  /** POC operational fields captured during the run. */
  invoiceGiven?: boolean;
  kmPhotoImg?: string; invoicePhotoImg?: string; gpsPhotoImg?: string;
  expenseAmount?: string; expenseNote?: string;
  /** WhatsApp share status. */
  sharedVendor?: boolean; sharedDriver?: boolean;
  /** Reported delays, oldest first — the audit log. */
  reports?: DelayReport[];
}

/** A remembered pickup/drop location, suggested while typing a new trip. */
export interface SavedPoint { label: string; mapUrl?: string }
/** A money/approval request a worker raises for the accountant to action. */
export interface MoneyRequest {
  id: string; createdOn: string; raisedBy: string;
  kind: 'expense' | 'advance' | 'trip' | 'other' | 'diesel';
  title: string; note?: string; amountPaise?: number; tripLr?: string;
  /** A diesel request links back to the Amazon route it was raised from, so the
   *  paid/rejected decision made in Expenses & Fuel can be shown on the run. */
  tourId?: string; tourCode?: string;
  status: 'pending' | 'approved' | 'rejected';
}

/**
 * What a resolved request is called. The client asked for diesel requests to
 * read "Paid / Reject"; every other kind is an approval. It's the same stored
 * state either way — only the word changes, so there's one approval model.
 */
export const requestStatusLabel = (r: MoneyRequest): string =>
  r.status === 'pending' ? 'Pending'
    : r.status === 'rejected' ? 'Rejected'
      : r.kind === 'diesel' ? 'Paid' : 'Approved';

/** The open diesel request for a route, if there is one. */
export const dieselRequestFor = (requests: MoneyRequest[], tourId?: string): MoneyRequest | undefined =>
  tourId ? requests.find((r) => r.kind === 'diesel' && r.tourId === tourId) : undefined;
/** Default expense categories. Not demo data — these are configuration, and the
 *  team adds their own on top (see addExpenseCategory). */
const DEFAULT_CATEGORIES = ['Toll', 'RTO/Police', 'Loading', 'Repairs', 'Office', 'Misc'];

/** The little that still lives in localStorage: per-device config, not data. */
interface StoreShape {
  staff: Staff[];
  savedPoints: SavedPoint[];
  expenseCategories: string[];
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
  /** Money — Firestore-backed, shared across the org (see lib/money). */
  invoices: Invoice[];
  expenses: Expense[];
  fuelLogs: FuelLog[];
  payroll: PayrollLine[];
  requests: MoneyRequest[];
  addTrip: (t: Omit<Trip, 'lr' | 'vrId' | 'id'>, handledBy?: { uid: string; name: string; leaderUid?: string }) => void;
  updateTripStatus: (id: string, status: TripStatus) => void;
  /** Edit / remove a trip or tour — leadership only (see canEditRecords). */
  updateTrip: (id: string, patch: Partial<Trip>) => void;
  deleteTrip: (id: string) => void;
  deleteTour: (t: Tour) => void;
  /** Advance a trip one step along its live timeline; pass a remark when finishing. */
  advanceTrip: (id: string, remark?: string) => void;
  addSavedPoint: (p: SavedPoint) => void;
  addInvoice: (i: Omit<Invoice, 'no' | 'gstPaise' | 'totalPaise' | 'id'> & { gstRate?: number }) => void;
  markInvoicePaid: (no: string) => void;
  addExpense: (e: Omit<Expense, 'id'>) => void;
  addFuelLog: (f: Omit<FuelLog, 'id'>) => void;
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
  /** Returns the new route's id so the caller can assign it to a POC next. */
  addTour: (t: Omit<Tour, 'id'>, handledBy?: { uid: string; name: string; leaderUid?: string }) => Promise<string>;
  updateTour: (id: string, patch: Partial<Tour>) => void;
  runPayroll: () => void;
  reset: () => void;
}

/**
 * Local blob key. Bumped to v3 when the demo data was retired: v2 holds the old
 * fake invoices/expenses/payroll on every device that ever ran the app, and a
 * new key is the only way to leave them behind — merging over a fresh seed would
 * resurrect them. The old key is deleted on load. The money data has since moved
 * to Firestore, so this blob now only carries per-device config.
 */
const KEY = 'sarva-partner-store-v3';
const LEGACY_KEYS = ['shipva-partner-store-v2', 'trips-seeded-v1',
  'ref-customers-seeded-v1', 'ref-drivers-seeded-v1', 'ref-trucks-seeded-v1', 'ref-owners-seeded-v1'];

/** A brand-new device: only the default expense categories (configuration, not
 *  data). Money and business records live in Firestore, not here. */
function seed(): StoreShape {
  return { staff: [], savedPoints: [], expenseCategories: [...DEFAULT_CATEGORIES] };
}

function load(): StoreShape {
  // Retire the demo-era blob and the one-time seeding flags.
  try { LEGACY_KEYS.forEach((k) => localStorage.removeItem(k)); } catch { /* private mode */ }
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...seed(), ...(JSON.parse(raw) as Record<string, unknown>) } as StoreShape;
  } catch { /* ignore corrupt cache */ }
  return seed();
}

const Ctx = createContext<StoreApi | null>(null);

let counter = 0;
const uid = () => `${Date.now().toString(36)}${(counter++).toString(36)}`;
const today = () => new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

/** Next invoice number — one past the highest that exists, floored at 1043.
 *  Derived from the live list rather than a running count, so it survives a
 *  refresh and two people billing at once collide far less often. */
function nextInvoiceNo(list: Invoice[]): string {
  const max = list.reduce((m, i) => {
    const n = parseInt(i.no.replace(/\D/g, ''), 10);
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 1042);
  return `INV-${max + 1}`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<StoreShape>(load);
  const { member } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const tripsRef = useRef<Trip[]>([]);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* quota */ }
  }, [s]);

  // Trips live in Firestore, scoped to the signed-in member (supervisors see
  // only their own; owner/managers see all).
  useEffect(() => {
    if (!member) { setTrips([]); tripsRef.current = []; return; }
    const scope = { uid: member.uid, role: member.role, leaderUid: member.leaderUid || member.uid };
    return watchTrips(scope, (list) => {
      setTrips(list);
      tripsRef.current = list;
    });
  }, [member?.uid, member?.role]);

  // Tours (Amazon routes) — Firestore-backed with the same POC scoping.
  const [tours, setTours] = useState<Tour[]>([]);
  useEffect(() => {
    if (!member) { setTours([]); return; }
    return watchToursFs({ uid: member.uid, role: member.role, leaderUid: member.leaderUid || member.uid }, setTours);
  }, [member?.uid, member?.role, member?.leaderUid]);

  const addTour = useCallback(async (t: Omit<Tour, 'id'>, handledBy?: { uid: string; name: string; leaderUid?: string }): Promise<string> => {
    if (!member) return '';
    return addTourDoc(t, { uid: member.uid, role: member.role, leaderUid: member.leaderUid || member.uid }, handledBy);
  }, [member?.uid, member?.role, member?.leaderUid]);

  const updateTour = useCallback((id: string, patch: Partial<Tour>) => {
    void updateTourDoc(id, patch);
  }, []);

  // ── Shared org data — reference (customers/drivers/trucks/owners) + money ────
  // Firestore-backed and common to the whole org: everyone reads the same lists
  // and any add shows up for the rest of the team. Bound to the signed-in member
  // because the rules require an org member; cleared on sign-out.
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [drivers, setDrivers] = useState<FleetDriver[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [attached, setAttached] = useState<AttachedTruck[]>([]);
  const attachedRef = useRef<AttachedTruck[]>([]);
  // Money — shared too. Invoices and payroll keep a ref so a mutation can resolve
  // the affected doc id from the human key (invoice `no`) it's called with.
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const invoicesRef = useRef<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [payroll, setPayroll] = useState<PayrollLine[]>([]);
  const payrollRef = useRef<PayrollLine[]>([]);
  const [requests, setRequests] = useState<MoneyRequest[]>([]);

  useEffect(() => {
    if (!member) {
      setCustomers([]); setDrivers([]); setTrucks([]); setAttached([]); attachedRef.current = [];
      setInvoices([]); invoicesRef.current = []; setExpenses([]); setFuelLogs([]);
      setPayroll([]); payrollRef.current = []; setRequests([]);
      return;
    }
    const unsubs = [
      customersCol.watch(setCustomers),
      driversCol.watch(setDrivers),
      trucksCol.watch(setTrucks),
      ownersCol.watch((l) => { setAttached(l); attachedRef.current = l; }),
      invoicesCol.watch((l) => { setInvoices(l); invoicesRef.current = l; }),
      expensesCol.watch(setExpenses),
      fuelLogsCol.watch(setFuelLogs),
      payrollCol.watch((l) => { setPayroll(l); payrollRef.current = l; }),
      requestsCol.watch(setRequests),
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

  const updateTrip = useCallback((id: string, patch: Partial<Trip>) => { void updateTripDoc(id, patch); }, []);
  const deleteTrip = useCallback((id: string) => { void deleteTripDoc(id); }, []);
  const deleteTour = useCallback((t: Tour) => { void deleteTourDoc(t); }, []);

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

  const addInvoice = useCallback((i: Omit<Invoice, 'no' | 'gstPaise' | 'totalPaise' | 'id'> & { gstRate?: number }) => {
    const gst = Math.round(i.basePaise * ((i.gstRate ?? 18) / 100));
    void invoicesCol.add({
      no: nextInvoiceNo(invoicesRef.current),
      client: i.client, date: i.date, dueDate: i.dueDate,
      basePaise: i.basePaise, gstPaise: gst, totalPaise: i.basePaise + gst, status: i.status,
    });
  }, []);

  const markInvoicePaid = useCallback((no: string) => {
    const inv = invoicesRef.current.find((i) => i.no === no);
    if (inv?.id) void invoicesCol.update(inv.id, { status: 'paid' });
  }, []);

  const addExpense = useCallback((e: Omit<Expense, 'id'>) => { void expensesCol.add(e); }, []);
  const addFuelLog = useCallback((f: Omit<FuelLog, 'id'>) => { void fuelLogsCol.add(f); }, []);

  const addExpenseCategory = useCallback((name: string) => {
    const n = name.trim();
    if (!n) return;
    setS((p) => (p.expenseCategories.some((c) => c.toLowerCase() === n.toLowerCase())
      ? p : { ...p, expenseCategories: [...p.expenseCategories, n] }));
  }, []);

  const addRequest = useCallback((r: Omit<MoneyRequest, 'id' | 'createdOn' | 'status'>) => {
    void requestsCol.add({ ...r, createdOn: today(), status: 'pending' });
  }, []);

  const resolveRequest = useCallback((id: string, status: 'approved' | 'rejected') => {
    void requestsCol.update(id, { status });
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
    // Idempotent — settle every 'due' line. No-op until a payroll run is added.
    payrollRef.current.forEach((l) => { if (l.id && l.status === 'due') void payrollCol.update(l.id, { status: 'paid' }); });
  }, []);

  const reset = useCallback(() => setS(seed()), []);

  const value = useMemo<StoreApi>(() => ({
    ...s, trips, tours, customers, drivers, trucks, attached,
    invoices, expenses, fuelLogs, payroll, requests,
    addTrip, updateTripStatus, updateTrip, deleteTrip, deleteTour,
    advanceTrip, addSavedPoint, addInvoice, markInvoicePaid, addExpense, addFuelLog,
    addExpenseCategory, addRequest, resolveRequest, addCustomer, addDriver, addTruck,
    setDriverDocs, setTruckDocs, updateDriver, updateTruck, deleteDriver, deleteTruck,
    setCustomerAgreement, setAttachedAgreement, updateCustomer, deleteCustomer, updateAttached, deleteAttached,
    addStaff, addAttached, recordOwnerPayment, addTour, updateTour, runPayroll, reset,
  }), [s, trips, tours, customers, drivers, trucks, attached,
    invoices, expenses, fuelLogs, payroll, requests,
    addTrip, updateTripStatus, updateTrip, deleteTrip, deleteTour,
    advanceTrip, addSavedPoint, addInvoice, markInvoicePaid, addExpense, addFuelLog,
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
