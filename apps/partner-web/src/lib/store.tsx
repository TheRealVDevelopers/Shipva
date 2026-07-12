/**
 * Partner data store — the single source of truth for the Transporter OS UI.
 *
 * Phase A: backed by localStorage so records created in the UI persist across
 * refresh. The component API (useStore) is deliberately backend-agnostic — in
 * Phase B the implementation swaps to Firestore (scoped per transporter tenant)
 * without changing any page that consumes it.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  trips as seedTrips, invoices as seedInvoices, expenses as seedExpenses,
  fuelLogs as seedFuelLogs, fleetDrivers as seedDrivers, trucks as seedTrucks,
  payroll as seedPayroll, staff as seedStaff,
  type Trip, type Invoice, type Expense, type FuelLog, type FleetDriver, type Truck,
  type PayrollLine, type Staff, type TripStatus,
} from './mocks.js';

/** Vendor agreement — absence means "not created yet". */
export interface Agreement {
  createdOn: string;
  effectiveFrom: string;
  durationMonths: number;
  ratePerKmPaise?: number;
  commissionPct?: number;
  notes?: string;
}

export interface Customer {
  id: string; name: string; gstin: string; phone: string; city: string;
  ratePerKmPaise: number; outstandingPaise: number;
  agreement?: Agreement;
}
const seedCustomers: Customer[] = [
  { id: 'c1', name: 'Bharat Steels', gstin: '29AABCB1111C1Z9', phone: '+91 98450 10001', city: 'Hosur', ratePerKmPaise: 4200, outstandingPaise: 1180000, agreement: { createdOn: '12 Jun 2026', effectiveFrom: '01 Jun 2026', durationMonths: 12, ratePerKmPaise: 4200 } },
  { id: 'c2', name: 'Vexa Polymers', gstin: '29AACCV2222D1Z8', phone: '+91 98450 10002', city: 'Chennai', ratePerKmPaise: 3800, outstandingPaise: 1357000 },
  { id: 'c3', name: 'FreshCo Dairy', gstin: '36AADCF3333E1Z7', phone: '+91 98450 10003', city: 'Hyderabad', ratePerKmPaise: 5100, outstandingPaise: 0 },
  { id: 'c4', name: 'Leela Stores', gstin: '29AAECL4444F1Z6', phone: '+91 98450 10004', city: 'Bengaluru', ratePerKmPaise: 3200, outstandingPaise: 113280 },
];

export interface AttachedTruck {
  id: string; owner: string; reg: string; phone: string; balancePaise: number; trips: number;
  agreement?: Agreement;
}
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
}
export interface Tour {
  id: string; date: string; tourId: string; vrId: string; seTracker: string; toll: string;
  amzEquipmentType: string; seEquipmentType: string; amzStatus: string; sarvaStatus: string;
  present: string; scheduleAdhoc: string; noLoadLoad: string; advanceAmount: string; paidPending: string;
  driver: string; vehicleId: string; driverNumber: string; vendorName: string;
  stops: TourStop[]; totalManualKm: string; amazonRelyKm: string; gpsKm: string; remarks: string;
}
const blankStop = (name = ''): TourStop => ({ name, amzArrival: '', kmPhoto: false, arrivalReport: '', amzDeparture: '', invoicePhoto: false, dispatchReport: '', km: '' });
const seedTours: Tour[] = [
  {
    id: 'tr1', date: '12 Jul 2026', tourId: 'T-30FPN1321', vrId: '112ZJHBB9', seTracker: '', toll: '',
    amzEquipmentType: '10ft Truck', seEquipmentType: '10ft Truck', amzStatus: 'PLANNED', sarvaStatus: 'PLANNED',
    present: 'PRESENT', scheduleAdhoc: 'SCHEDULE', noLoadLoad: 'Load', advanceAmount: '2500', paidPending: 'Pending',
    driver: 'Shiva Kumar', vehicleId: 'KA07B5304', driverNumber: '85536 39858', vendorName: 'Prince transport',
    stops: [
      { name: 'HKA3', amzArrival: '07:00', kmPhoto: true, arrivalReport: 'OK', amzDeparture: '09:30', invoicePhoto: true, dispatchReport: 'OK', km: '0' },
      { name: 'TBH2', amzArrival: '11:30', kmPhoto: true, arrivalReport: 'OK', amzDeparture: '12:30', invoicePhoto: true, dispatchReport: 'OK', km: '42' },
      { name: 'TBL3', amzArrival: '13:00', kmPhoto: false, arrivalReport: '', amzDeparture: '14:00', invoicePhoto: false, dispatchReport: '', km: '18' },
      { name: 'TBT3', amzArrival: '15:00', kmPhoto: false, arrivalReport: '', amzDeparture: '16:00', invoicePhoto: false, dispatchReport: '', km: '22' },
    ],
    totalManualKm: '82', amazonRelyKm: '80', gpsKm: '84', remarks: 'On schedule',
  },
  {
    id: 'tr2', date: '11 Jul 2026', tourId: 'T-30FPN1290', vrId: '119KLMPP2', seTracker: '', toll: '120',
    amzEquipmentType: '17ft Truck', seEquipmentType: '17ft Truck', amzStatus: 'COMPLETED', sarvaStatus: 'COMPLETED',
    present: 'PRESENT', scheduleAdhoc: 'SCHEDULE', noLoadLoad: 'Load', advanceAmount: '3200', paidPending: 'Paid',
    driver: 'Ramesh Yadav', vehicleId: 'KA01C5521', driverNumber: '99020 51001', vendorName: 'Karnataka Roadlines',
    stops: [
      { name: 'HKA3', amzArrival: '06:30', kmPhoto: true, arrivalReport: 'OK', amzDeparture: '08:00', invoicePhoto: true, dispatchReport: 'OK', km: '0' },
      { name: 'TBT3', amzArrival: '10:00', kmPhoto: true, arrivalReport: 'OK', amzDeparture: '11:00', invoicePhoto: true, dispatchReport: 'OK', km: '58' },
      blankStop(), blankStop(),
    ],
    totalManualKm: '58', amazonRelyKm: '56', gpsKm: '59', remarks: '',
  },
];

interface StoreShape {
  trips: Trip[];
  invoices: Invoice[];
  expenses: Expense[];
  fuelLogs: FuelLog[];
  drivers: FleetDriver[];
  trucks: Truck[];
  payroll: PayrollLine[];
  staff: Staff[];
  customers: Customer[];
  attached: AttachedTruck[];
  tours: Tour[];
}

interface StoreApi extends StoreShape {
  addTrip: (t: Omit<Trip, 'lr'>) => void;
  updateTripStatus: (lr: string, status: TripStatus) => void;
  addInvoice: (i: Omit<Invoice, 'no' | 'gstPaise' | 'totalPaise'> & { gstRate?: number }) => void;
  markInvoicePaid: (no: string) => void;
  addExpense: (e: Expense) => void;
  addFuelLog: (f: FuelLog) => void;
  addCustomer: (c: Omit<Customer, 'id' | 'outstandingPaise'>) => void;
  addDriver: (d: Omit<FleetDriver, 'id'>) => void;
  addTruck: (t: Omit<Truck, 'id'>) => void;
  setDriverDocs: (id: string, docs: Pick<FleetDriver, 'aadhaar' | 'licenseNo' | 'licenseExpiry' | 'aadhaarImg' | 'licenseImg'>) => void;
  setTruckDocs: (id: string, docs: Pick<Truck, 'rc' | 'insuranceNo' | 'insuranceExpiry' | 'fitnessNo' | 'fitnessExpiry' | 'rcImg' | 'insuranceImg' | 'fitnessImg'>) => void;
  setCustomerAgreement: (id: string, a: Agreement) => void;
  setAttachedAgreement: (id: string, a: Agreement) => void;
  addStaff: (s: Omit<Staff, 'id'>) => void;
  addAttached: (a: Omit<AttachedTruck, 'id'>) => void;
  recordOwnerPayment: (id: string, amountPaise: number) => void;
  addTour: (t: Omit<Tour, 'id'>) => void;
  runPayroll: () => void;
  reset: () => void;
}

const KEY = 'shipva-partner-store-v2';

function seed(): StoreShape {
  return {
    trips: seedTrips, invoices: seedInvoices, expenses: seedExpenses, fuelLogs: seedFuelLogs,
    drivers: seedDrivers, trucks: seedTrucks, payroll: seedPayroll, staff: seedStaff,
    customers: seedCustomers, attached: seedAttached, tours: seedTours,
  };
}

function load(): StoreShape {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...seed(), ...JSON.parse(raw) };
  } catch { /* ignore corrupt cache */ }
  return seed();
}

const Ctx = createContext<StoreApi | null>(null);

let counter = 0;
const uid = () => `${Date.now().toString(36)}${(counter++).toString(36)}`;
const today = () => new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<StoreShape>(load);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* quota */ }
  }, [s]);

  const addTrip = useCallback((t: Omit<Trip, 'lr'>) => {
    setS((p) => ({ ...p, trips: [{ ...t, lr: `LR-${24818 + p.trips.length}` }, ...p.trips] }));
  }, []);

  const updateTripStatus = useCallback((lr: string, status: TripStatus) => {
    setS((p) => ({ ...p, trips: p.trips.map((t) => (t.lr === lr ? { ...t, status } : t)) }));
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

  const addCustomer = useCallback((c: Omit<Customer, 'id' | 'outstandingPaise'>) => {
    setS((p) => ({ ...p, customers: [{ ...c, id: uid(), outstandingPaise: 0 }, ...p.customers] }));
  }, []);

  const addDriver = useCallback((d: Omit<FleetDriver, 'id'>) => {
    setS((p) => ({ ...p, drivers: [{ ...d, id: uid() }, ...p.drivers] }));
  }, []);

  const addTruck = useCallback((t: Omit<Truck, 'id'>) => {
    setS((p) => ({ ...p, trucks: [{ ...t, id: uid() }, ...p.trucks] }));
  }, []);

  const setDriverDocs = useCallback((id: string, docs: Pick<FleetDriver, 'aadhaar' | 'licenseNo' | 'licenseExpiry' | 'aadhaarImg' | 'licenseImg'>) => {
    setS((p) => ({ ...p, drivers: p.drivers.map((d) => (d.id === id ? { ...d, ...docs } : d)) }));
  }, []);

  const setTruckDocs = useCallback((id: string, docs: Pick<Truck, 'rc' | 'insuranceNo' | 'insuranceExpiry' | 'fitnessNo' | 'fitnessExpiry' | 'rcImg' | 'insuranceImg' | 'fitnessImg'>) => {
    setS((p) => ({ ...p, trucks: p.trucks.map((t) => (t.id === id ? { ...t, ...docs } : t)) }));
  }, []);

  const setCustomerAgreement = useCallback((id: string, a: Agreement) => {
    setS((p) => ({ ...p, customers: p.customers.map((c) => (c.id === id ? { ...c, agreement: a } : c)) }));
  }, []);

  const setAttachedAgreement = useCallback((id: string, a: Agreement) => {
    setS((p) => ({ ...p, attached: p.attached.map((x) => (x.id === id ? { ...x, agreement: a } : x)) }));
  }, []);

  const addStaff = useCallback((st: Omit<Staff, 'id'>) => {
    setS((p) => ({ ...p, staff: [{ ...st, id: uid() }, ...p.staff] }));
  }, []);

  const recordOwnerPayment = useCallback((id: string, amountPaise: number) => {
    setS((p) => ({ ...p, attached: p.attached.map((x) => (x.id === id ? { ...x, balancePaise: Math.max(0, x.balancePaise - amountPaise) } : x)) }));
  }, []);

  const addAttached = useCallback((a: Omit<AttachedTruck, 'id'>) => {
    setS((p) => ({ ...p, attached: [{ ...a, id: uid() }, ...p.attached] }));
  }, []);

  const addTour = useCallback((t: Omit<Tour, 'id'>) => {
    setS((p) => ({ ...p, tours: [{ ...t, id: uid() }, ...p.tours] }));
  }, []);

  const runPayroll = useCallback(() => {
    setS((p) => ({ ...p, payroll: p.payroll.map((l) => ({ ...l, status: 'paid' })) }));
  }, []);

  const reset = useCallback(() => setS(seed()), []);

  const value = useMemo<StoreApi>(() => ({
    ...s, addTrip, updateTripStatus, addInvoice, markInvoicePaid, addExpense, addFuelLog, addCustomer, addDriver, addTruck,
    setDriverDocs, setTruckDocs, setCustomerAgreement, setAttachedAgreement, addStaff, addAttached, recordOwnerPayment, addTour, runPayroll, reset,
  }), [s, addTrip, updateTripStatus, addInvoice, markInvoicePaid, addExpense, addFuelLog, addCustomer, addDriver, addTruck,
    setDriverDocs, setTruckDocs, setCustomerAgreement, setAttachedAgreement, addStaff, addAttached, recordOwnerPayment, addTour, runPayroll, reset]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be used inside <StoreProvider>');
  return v;
}

export { today as todayLabel };
