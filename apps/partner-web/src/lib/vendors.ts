/**
 * Vendor linkage — Transporter → Truck Owner → Truck → Driver.
 *
 * The client's model: a truck and a driver each belong to a vendor, where a
 * "vendor" is either a transporter or a truck owner. Route assignment then shows
 * only the vehicles and drivers linked to the vendor chosen for that run — you
 * can't put someone else's driver on your vendor's truck by accident.
 *
 * ── Why the matching is alias-aware ──────────────────────────────────────────
 * A driver stores its vendor as the NAME it was picked under, and the link is a
 * name match. That is fragile, and it broke in production: a truck owner is
 * listed under `transporterName` when set, else their own `owner` name, so the
 * moment somebody filled in the optional "operates under" field on an existing
 * owner, the picker started showing the transporter's name while every driver
 * already registered still held the owner's name. Selecting that vendor then
 * produced an empty driver list — for every owner the field had been filled
 * for. Renaming a transporter did the same thing.
 *
 * So a vendor now resolves to EVERY name it is known by, and a driver or truck
 * matches if its stored name is any of them, compared case- and
 * whitespace-insensitively. Renaming or reclassifying a vendor no longer
 * orphans the people attached to it.
 *
 * The real fix is a stable vendor id on the driver rather than a name; that
 * needs a migration of live records, so this keeps the existing data working
 * without one. `canonicalVendorName` is here for when that migration happens.
 */
import type { Customer, AttachedTruck } from './store.js';
import type { FleetDriver, Truck } from './mocks.js';

/**
 * Compare vendor names the way a person would.
 *
 * Punctuation is dropped, not just case and spacing — the live register has
 * the same vendor written every which way, and these must all be one name:
 *   "A A Transport (Abhilash)"      (how the vendor picker lists it)
 *   "(A A Transport) Abhilash"      (how the drivers were saved)
 *   "(Lucky Transport)Manoj M"      (no space after the bracket)
 *   "(Raju Kamal Transport ) Raju"  (space before it)
 * Every bracket becomes a space and runs of space collapse, so all four land
 * on the same string. Word ORDER is still respected, so two genuinely
 * different vendors can't be merged by accident.
 */
const norm = (s?: string | undefined): string =>
  (s ?? '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')  // brackets, dots, dashes → space
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

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

/** The registers a vendor name is resolved against. */
export interface VendorBook {
  customers: Customer[];
  owners: AttachedTruck[];
}

/**
 * Every name this vendor may have been recorded under — its current listed
 * name plus, for a truck owner, both their own name and the transporter they
 * run under. Normalised, so callers can compare directly.
 */
export function vendorAliases(vendor: string, book?: VendorBook): Set<string> {
  const want = norm(vendor);
  const out = new Set<string>();
  if (!want) return out;
  out.add(want);
  if (!book) return out;

  book.customers.forEach((c) => {
    if (norm(c.name) === want) out.add(norm(c.name));
  });
  book.owners.forEach((a) => {
    const own = norm(a.owner);
    const trading = norm(a.transporterName);
    // An owner is also commonly written as the two names together — the
    // register has both "A A Transport Abhilash" and "Abhilash A A Transport".
    // Treat every form of this one owner as the same vendor.
    const forms = [own, trading, `${trading} ${own}`.trim(), `${own} ${trading}`.trim()]
      .map((s) => s.trim()).filter(Boolean);
    if (forms.includes(want)) forms.forEach((f) => out.add(f));
  });
  return out;
}

/** Does this record's stored vendor name belong to `vendor`? */
const linked = (stored: string | undefined, aliases: Set<string>): boolean =>
  aliases.has(norm(stored));

/**
 * Drivers linked to a vendor. Own-fleet drivers (no vendor) show when no
 * vendor is chosen. Pass the `book` so a driver registered under an owner's
 * old name still appears once that owner is listed under a transporter.
 */
export const driversForVendor = (drivers: FleetDriver[], vendor: string, book?: VendorBook): FleetDriver[] => {
  if (!vendor) return drivers.filter((d) => !d.vendor);
  const aliases = vendorAliases(vendor, book);
  return drivers.filter((d) => linked(d.vendor, aliases));
};

/** Trucks linked to a vendor (own-fleet trucks have no vendor). */
export const trucksForVendor = (trucks: Truck[], vendor: string, book?: VendorBook): Truck[] => {
  if (!vendor) return trucks.filter((t) => !t.vendor);
  const aliases = vendorAliases(vendor, book);
  return trucks.filter((t) => linked(t.vendor, aliases));
};

/**
 * The name a vendor should be stored under going forward — its current listed
 * name. Use when writing a driver or truck so new records don't inherit an
 * out-of-date alias.
 */
export function canonicalVendorName(vendor: string, book?: VendorBook): string {
  const want = norm(vendor);
  if (!book || !want) return vendor.trim();
  const owner = book.owners.find((a) => norm(a.owner) === want || norm(a.transporterName) === want);
  if (owner) return ownerVendorName(owner);
  const cust = book.customers.find((c) => norm(c.name) === want);
  return cust ? cust.name.trim() : vendor.trim();
}

/**
 * Drivers and trucks whose vendor name matches no registered vendor at all —
 * genuinely orphaned records, which the UI should surface rather than silently
 * omit. Distinct from the alias case above, which is now handled.
 */
export function orphanedVendorNames(
  drivers: FleetDriver[], trucks: Truck[], book: VendorBook,
): string[] {
  const known = new Set<string>();
  book.customers.forEach((c) => known.add(norm(c.name)));
  book.owners.forEach((a) => { known.add(norm(a.owner)); if (a.transporterName) known.add(norm(a.transporterName)); });
  const seen = new Set<string>();
  [...drivers.map((d) => d.vendor), ...trucks.map((t) => t.vendor)].forEach((v) => {
    const n = norm(v);
    if (n && !known.has(n)) seen.add(v!.trim());
  });
  return [...seen].sort((a, b) => a.localeCompare(b));
}

/**
 * How well one record's stored vendor name lines up with the register.
 *  exact  — identical to a registered vendor. Nothing to do.
 *  loose  — the same vendor written differently (brackets, spacing, case, or
 *           the owner/transporter pair in the other order). It WORKS, because
 *           matching is tolerant, but the text is untidy and it is what made
 *           this fragile in the first place.
 *  orphan — matches no registered vendor at all. This record is invisible in
 *           Route Assign and needs a human to say who it belongs to.
 */
export type VendorLinkState = 'exact' | 'loose' | 'orphan';

export interface VendorLinkIssue {
  kind: 'Driver' | 'Truck';
  id: string;
  /** Driver's name or truck's registration — how a person identifies it. */
  label: string;
  /** Exactly what the record holds today. */
  stored: string;
  state: VendorLinkState;
  /** The registered vendor this resolves to, when it resolves at all. */
  suggested?: string;
}

/**
 * Every driver and truck whose vendor name isn't an exact match, so the team
 * can tidy the register in one pass. Own-fleet records (no vendor) are not
 * issues and are left out.
 */
export function auditVendorLinks(
  drivers: FleetDriver[], trucks: Truck[], book: VendorBook,
): VendorLinkIssue[] {
  const registered = vendorNamesOf(book.customers, book.owners);
  const exact = new Set(registered.map((n) => n.trim()));

  const classify = (stored: string): { state: VendorLinkState; suggested?: string } => {
    if (exact.has(stored.trim())) return { state: 'exact' };
    // Tolerant matching is what Route Assign uses — if that finds the vendor,
    // the record works and only the spelling is off.
    const hit = registered.find((v) => vendorAliases(v, book).has(norm(stored)));
    if (hit) return { state: 'loose', suggested: hit };
    return { state: 'orphan' };
  };

  const issues: VendorLinkIssue[] = [];
  drivers.forEach((d) => {
    const stored = (d.vendor ?? '').trim();
    if (!stored || !d.id) return;
    const { state, suggested } = classify(stored);
    if (state !== 'exact') issues.push({ kind: 'Driver', id: d.id, label: d.name, stored, state, ...(suggested ? { suggested } : {}) });
  });
  trucks.forEach((t) => {
    const stored = (t.vendor ?? '').trim();
    if (!stored || !t.id) return;
    const { state, suggested } = classify(stored);
    if (state !== 'exact') issues.push({ kind: 'Truck', id: t.id, label: t.reg, stored, state, ...(suggested ? { suggested } : {}) });
  });

  // Orphans first — those are the ones actually broken.
  const rank = (s: VendorLinkState) => (s === 'orphan' ? 0 : 1);
  return issues.sort((a, b) => rank(a.state) - rank(b.state)
    || a.stored.localeCompare(b.stored)
    || a.label.localeCompare(b.label));
}
