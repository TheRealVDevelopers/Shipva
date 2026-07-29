/**
 * Regression tests for the fault reported on 28 July: "I could select a vendor
 * but then no drivers appeared — for most of the vendors."
 *
 * Cause: a driver stores its vendor as the NAME it was picked under, and a
 * truck owner is listed under `transporterName` when that optional field is
 * set, else their own name. Filling that field in later silently changed which
 * name the picker offered, orphaning every driver already registered.
 */
import { describe, it, expect } from 'vitest';
import {
  driversForVendor, trucksForVendor, vendorNamesOf, canonicalVendorName,
  orphanedVendorNames, type VendorBook,
} from '../src/lib/vendors.js';

type Driver = Parameters<typeof driversForVendor>[0][number];
type Truck = Parameters<typeof trucksForVendor>[0][number];

const drv = (id: string, name: string, vendor?: string) => ({ id, name, vendor } as unknown as Driver);
const trk = (id: string, reg: string, vendor?: string) => ({ id, reg, vendor } as unknown as Truck);

/** A truck owner who has since been put under a transporter. */
const book: VendorBook = {
  customers: [{ name: 'Captan Bharathi Raj' }] as unknown as VendorBook['customers'],
  owners: [
    { owner: 'Ramesh K', transporterName: 'SLV Logistics' },
    { owner: 'Independent Singh', transporterName: '' },
  ] as unknown as VendorBook['owners'],
};

/**
 * Verbatim from the live Driver Register (28 July screenshot). The vendor
 * picker lists these owners one way and the drivers were saved another; every
 * pair below is ONE vendor and must match.
 */
describe('the live register’s real spellings', () => {
  const cases: [picker: string, storedOnDriver: string, driver: string][] = [
    ['A A Transport (Abhilash)', '(A A Transport) Abhilash', 'Karthik'],
    ['Lucky Transport (Manoj M)', '(Lucky Transport)Manoj M', 'Ravi Chanappa Devasur'],
    ['Raju Kamal Transport (Raju)', '(Raju Kamal Transport ) Raju', 'Raju'],
    ['Tharun Gwoda Transport (Anjanappa)', '(Tharun Gwoda Transport)Anjanappa', 'Manjunath Gowda'],
    ['Vijai Transport (Vijai Kumar)', 'Vijai Transport (Vijai Kumar )', 'Mithun G'],
    ['S L V Transport (B H MAHESH)', '(S L V Transport ) B H MAHESH', 'Suhas'],
    ['Nikshith Transport', 'Nikshith Transport', 'Uday coorg'],
    ['Basavaraju S C', 'Basavaraju S C', 'Basavaraju S C'],
  ];

  it.each(cases)('%s finds the driver saved as "%s"', (picker, stored, driverName) => {
    const b: VendorBook = {
      customers: [],
      owners: [{ owner: picker, transporterName: '' }] as unknown as VendorBook['owners'],
    };
    const drivers = [drv('d1', driverName, stored), drv('d2', 'Someone Else', 'Totally Different Transport')];
    expect(driversForVendor(drivers, picker, b).map((d) => d.name)).toEqual([driverName]);
  });

  it('still refuses a genuinely different vendor', () => {
    const b: VendorBook = {
      customers: [],
      owners: [{ owner: 'A A Transport (Abhilash)', transporterName: '' }] as unknown as VendorBook['owners'],
    };
    // Same shape, different words — must NOT match.
    const drivers = [drv('d1', 'Wrong', '(B B Transport) Bhaskar')];
    expect(driversForVendor(drivers, 'A A Transport (Abhilash)', b)).toEqual([]);
  });

  it('matches when the owner record keeps the two names in separate fields', () => {
    const b: VendorBook = {
      customers: [],
      owners: [{ owner: 'Abhilash', transporterName: 'A A Transport' }] as unknown as VendorBook['owners'],
    };
    const drivers = [drv('d1', 'Karthik', '(A A Transport) Abhilash')];
    // Listed as just "A A Transport", driver saved with both names.
    expect(driversForVendor(drivers, 'A A Transport', b).map((d) => d.name)).toEqual(['Karthik']);
    expect(driversForVendor(drivers, 'Abhilash', b).map((d) => d.name)).toEqual(['Karthik']);
  });
});

describe('vendor linkage', () => {
  it('THE BUG: a driver registered under the owner’s name still shows once the owner is put under a transporter', () => {
    // Registered back when the owner was listed as "Ramesh K".
    const drivers = [drv('d1', 'Yoganantha', 'Ramesh K')];
    // The picker now offers "SLV Logistics" — this used to return [].
    expect(vendorNamesOf(book.customers, book.owners)).toContain('SLV Logistics');
    expect(driversForVendor(drivers, 'SLV Logistics', book).map((d) => d.name)).toEqual(['Yoganantha']);
    // And it still works under the old name, so nothing already working breaks.
    expect(driversForVendor(drivers, 'Ramesh K', book).map((d) => d.name)).toEqual(['Yoganantha']);
  });

  it('the same for trucks', () => {
    const trucks = [trk('t1', 'TN73BX8394', 'Ramesh K')];
    expect(trucksForVendor(trucks, 'SLV Logistics', book).map((t) => t.reg)).toEqual(['TN73BX8394']);
  });

  it('tolerates stray spacing and casing in the stored name', () => {
    const drivers = [
      drv('d1', 'A', '  ramesh   k '),
      drv('d2', 'B', 'SLV LOGISTICS'),
    ];
    expect(driversForVendor(drivers, 'SLV Logistics', book).map((d) => d.name).sort()).toEqual(['A', 'B']);
  });

  it('does not leak another vendor’s drivers', () => {
    const drivers = [
      drv('d1', 'Mine', 'Ramesh K'),
      drv('d2', 'Theirs', 'Captan Bharathi Raj'),
      drv('d3', 'OwnFleet'),
    ];
    expect(driversForVendor(drivers, 'SLV Logistics', book).map((d) => d.name)).toEqual(['Mine']);
    expect(driversForVendor(drivers, 'Captan Bharathi Raj', book).map((d) => d.name)).toEqual(['Theirs']);
  });

  it('an independent owner is unaffected', () => {
    const drivers = [drv('d1', 'Solo', 'Independent Singh')];
    expect(driversForVendor(drivers, 'Independent Singh', book).map((d) => d.name)).toEqual(['Solo']);
  });

  it('no vendor still means the own fleet', () => {
    const drivers = [drv('d1', 'Staff'), drv('d2', 'Vendor', 'Ramesh K')];
    expect(driversForVendor(drivers, '', book).map((d) => d.name)).toEqual(['Staff']);
  });

  it('still works with no book passed, for callers that have not been updated', () => {
    const drivers = [drv('d1', 'X', 'Ramesh K')];
    expect(driversForVendor(drivers, 'Ramesh K').map((d) => d.name)).toEqual(['X']);
  });

  it('canonicalVendorName reports the name a vendor is listed under now', () => {
    expect(canonicalVendorName('Ramesh K', book)).toBe('SLV Logistics');
    expect(canonicalVendorName('SLV Logistics', book)).toBe('SLV Logistics');
    expect(canonicalVendorName('Independent Singh', book)).toBe('Independent Singh');
  });

  it('flags records pointing at a vendor that no longer exists', () => {
    const drivers = [drv('d1', 'Ghost', 'Deleted Transport Co'), drv('d2', 'Fine', 'Ramesh K')];
    expect(orphanedVendorNames(drivers, [], book)).toEqual(['Deleted Transport Co']);
  });
});
