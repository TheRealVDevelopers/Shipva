/**
 * Registration uniqueness — the client's rule: "no duplicate vehicle numbers,
 * mobile numbers, driving licence numbers, RC numbers, Aadhaar, PAN, GST, or
 * any other unique ID. Only the name may repeat."
 *
 * Every identity number a record can carry is checked here, against ALL four
 * registers together (transporters, truck owners, drivers, trucks), because a
 * PAN, an Aadhaar, a vehicle number or a phone identifies one real thing —
 * letting the same one sit under a driver and a truck owner is exactly the
 * duplicate the client wants stopped. Comparison ignores case and spacing so
 * "KA05 K2245" and "ka05k2245" count as the same.
 *
 * The record being edited is excluded by its own id, so saving an unchanged
 * record never trips its own numbers.
 */
import type { Customer, AttachedTruck } from './store.js';
import type { FleetDriver, Truck } from './mocks.js';

/** Normalise an ID for comparison: trim, collapse spaces, upper-case. */
const norm = (v?: string | undefined): string =>
  (v ?? '').replace(/\s+/g, '').toUpperCase();

/** A human label for each kind of number, used in the error message. */
export type IdKind =
  | 'phone' | 'aadhaar' | 'pan' | 'gstin'
  | 'vehicleReg' | 'rc' | 'licence' | 'insurance' | 'fitness';

export const ID_LABEL: Record<IdKind, string> = {
  phone: 'mobile number',
  aadhaar: 'Aadhaar number',
  pan: 'PAN',
  gstin: 'GSTIN',
  vehicleReg: 'vehicle number',
  rc: 'RC number',
  licence: 'driving licence number',
  insurance: 'insurance number',
  fitness: 'fitness certificate number',
};

/** Where a number was already found — named so the error can point at it. */
export interface IdOwner { kind: string; label: string; id: string }

export interface Registers {
  customers: Customer[];
  owners: AttachedTruck[];
  drivers: FleetDriver[];
  trucks: Truck[];
}

/** Every value of one id-kind already on file, mapped to who holds it. Built
 *  once per form open and reused for each field, so a big register isn't
 *  rescanned per keystroke. */
function indexOf(kind: IdKind, regs: Registers): Map<string, IdOwner> {
  const m = new Map<string, IdOwner>();
  const add = (raw: string | undefined, owner: IdOwner) => {
    const k = norm(raw);
    if (k && !m.has(k)) m.set(k, owner);
  };
  const cust = (c: Customer): IdOwner => ({ kind: 'Transporter', label: c.name, id: c.id });
  const own = (a: AttachedTruck): IdOwner => ({ kind: 'Truck Owner', label: a.transporterName || a.owner, id: a.id });
  const drv = (d: FleetDriver): IdOwner => ({ kind: 'Driver', label: d.name, id: d.id });
  const trk = (t: Truck): IdOwner => ({ kind: 'Truck', label: t.reg, id: t.id });

  switch (kind) {
    case 'phone':
      regs.customers.forEach((c) => { add(c.phone, cust(c)); add(c.phone2, cust(c)); });
      regs.owners.forEach((a) => { add(a.phone, own(a)); add(a.phone2, own(a)); });
      regs.drivers.forEach((d) => add(d.phone, drv(d)));
      break;
    case 'aadhaar':
      regs.customers.forEach((c) => add(c.aadhaar, cust(c)));
      regs.owners.forEach((a) => add(a.aadhaar, own(a)));
      regs.drivers.forEach((d) => add(d.aadhaar, drv(d)));
      break;
    case 'pan':
      regs.customers.forEach((c) => add(c.pan, cust(c)));
      regs.owners.forEach((a) => add(a.pan, own(a)));
      regs.drivers.forEach((d) => add(d.pan, drv(d)));
      break;
    case 'gstin':
      regs.customers.forEach((c) => add(c.gstin, cust(c)));
      regs.owners.forEach((a) => add(a.gstin, own(a)));
      break;
    case 'vehicleReg':
      // A vehicle number identifies one lorry — checked across the truck
      // register AND the truck owners' own vehicle field.
      regs.trucks.forEach((t) => add(t.reg, trk(t)));
      regs.owners.forEach((a) => add(a.reg, own(a)));
      break;
    case 'rc':
      regs.trucks.forEach((t) => add(t.rc, trk(t)));
      break;
    case 'licence':
      regs.drivers.forEach((d) => add(d.licenseNo, drv(d)));
      break;
    case 'insurance':
      regs.trucks.forEach((t) => add(t.insuranceNo, trk(t)));
      break;
    case 'fitness':
      regs.trucks.forEach((t) => add(t.fitnessNo, trk(t)));
      break;
  }
  return m;
}

/**
 * If `value` for this id-kind is already registered to a DIFFERENT record,
 * returns a ready-to-show error; otherwise ''. `selfId` is the record being
 * edited, so it never clashes with itself.
 */
export function duplicateError(
  kind: IdKind, value: string, regs: Registers, selfId?: string,
): string {
  const k = norm(value);
  if (!k) return '';
  const hit = indexOf(kind, regs).get(k);
  if (!hit || hit.id === selfId) return '';
  return `This ${ID_LABEL[kind]} is already registered to ${hit.kind} “${hit.label}”.`;
}

/**
 * Free-text register search — the client's second ask: "search by name or
 * number" across the transporter, truck-owner, driver and truck lists.
 *
 * `haystack` gathers every field worth matching (name, phone, licence, PAN,
 * Aadhaar, GST, vehicle number, RC, vehicle type…); `recordMatches` returns
 * true when every whitespace-separated term in the query appears somewhere in
 * it — so "yoga 90433" finds a driver by part of the name AND part of the
 * phone at once. Empty query matches everything.
 */
export function recordMatches(haystack: (string | number | undefined)[], query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = haystack.filter(Boolean).join(' ').toLowerCase();
  return q.split(/\s+/).every((term) => hay.includes(term));
}

/** Convenience: check a whole batch at once. Returns the first error, or ''. */
export function firstDuplicateError(
  checks: { kind: IdKind; value: string }[], regs: Registers, selfId?: string,
): string {
  for (const c of checks) {
    const e = duplicateError(c.kind, c.value, regs, selfId);
    if (e) return e;
  }
  return '';
}
