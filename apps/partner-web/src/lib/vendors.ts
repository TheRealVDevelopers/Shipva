/**
 * Vendor linkage — Transporter → Truck Owner → Truck → Driver.
 *
 * The client's model: a truck and a driver each belong to a vendor, where a
 * "vendor" is either a transporter or a truck owner. Route assignment then shows
 * only the vehicles and drivers linked to the vendor chosen for that run — you
 * can't put someone else's driver on your vendor's truck by accident.
 *
 * A vendor is identified by the name it trades under. For a truck owner that's
 * `transporterName` when set, else the owner's own name; for a transporter it's
 * the legal entity name. These are the same strings the driver and truck forms
 * save into their `vendor` field, so linkage is a plain name match.
 */
import type { Customer, AttachedTruck } from './store.js';
import type { FleetDriver, Truck } from './mocks.js';

/** The trading name a truck owner is listed under on the vendor picker. */
export const ownerVendorName = (a: AttachedTruck): string =>
  (a.transporterName?.trim() || a.owner.trim());

/** Every registered vendor name — transporters and truck owners together,
 *  de-duplicated and sorted. */
export function vendorNamesOf(customers: Customer[], owners: AttachedTruck[]): string[] {
  const names = [
    ...customers.map((c) => c.name.trim()),
    ...owners.map(ownerVendorName),
  ].filter(Boolean);
  return [...new Set(names)].sort((a, b) => a.localeCompare(b));
}

/** Drivers linked to a vendor (own-fleet drivers have no vendor). */
export const driversForVendor = (drivers: FleetDriver[], vendor: string): FleetDriver[] =>
  vendor ? drivers.filter((d) => (d.vendor ?? '') === vendor) : drivers.filter((d) => !d.vendor);

/** Trucks linked to a vendor (own-fleet trucks have no vendor). */
export const trucksForVendor = (trucks: Truck[], vendor: string): Truck[] =>
  vendor ? trucks.filter((t) => (t.vendor ?? '') === vendor) : trucks.filter((t) => !t.vendor);
