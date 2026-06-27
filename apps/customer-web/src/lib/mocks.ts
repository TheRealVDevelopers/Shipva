import type { CxBid, CxBooking, CxDriver } from './store.js';

export const SAVED_ADDRESSES = [
  { label: 'Home', line: '12, 4th Cross, Koramangala 5th Block' },
  { label: 'Shop', line: 'Leela Stores, Indiranagar 100ft Rd' },
  { label: 'Warehouse', line: 'Unit 7, Peenya Industrial Area, Phase 2' },
];

const DRIVERS: CxDriver[] = [
  { name: 'Ravi Kumar', phone: '+919902011234', vehicleReg: 'KA01AB1234', ratingAvg: 4.8, etaMin: 6 },
  { name: 'Suresh Nayak', phone: '+919902027782', vehicleReg: 'KA05CJ7782', ratingAvg: 4.6, etaMin: 9 },
  { name: 'Rafiq Ahmed', phone: '+919902044410', vehicleReg: 'KA03MN4410', ratingAvg: 4.9, etaMin: 4 },
  { name: 'Anil Hegde', phone: '+919902090087', vehicleReg: 'KA02GH9087', ratingAvg: 4.5, etaMin: 11 },
];

const BIDDERS = [
  { name: 'Karnataka Roadlines', ratingAvg: 4.6, vehicleReg: 'KA01C5521' },
  { name: 'Sri Venkateshwara Transport', ratingAvg: 4.8, vehicleReg: 'KA02D9930' },
  { name: 'Bharadwaj Carriers', ratingAvg: 4.3, vehicleReg: 'KA51F1207' },
  { name: 'Deccan Freight Movers', ratingAvg: 4.7, vehicleReg: 'KA09H8810' },
];

/** Pick a random driver to simulate an instant accept. */
export function randomDriver(): CxDriver {
  return DRIVERS[Math.floor(Math.random() * DRIVERS.length)]!;
}

/** Generate a competing bid below the floor, to simulate an auction. */
export function makeBid(floorPaise: number, index: number): CxBid {
  const b = BIDDERS[index % BIDDERS.length]!;
  const drop = 0.88 + Math.random() * 0.1; // 88%–98% of floor
  return {
    id: `bid-${Date.now()}-${index}`,
    name: b.name,
    ratingAvg: b.ratingAvg,
    vehicleReg: b.vehicleReg,
    amountPaise: Math.round((floorPaise * drop) / 1000) * 1000,
  };
}

/** Seed history so the app doesn't start empty. */
export const seedBookings: CxBooking[] = [
  {
    id: 'GN-5990', type: 'instant', tripType: 'intercity', vehicleType: 'mini_truck',
    pickup: 'Indiranagar 100ft Rd', drop: 'Domlur', distanceKm: 3.6, status: 'delivered',
    farePaise: 16920, driver: { name: 'Rafiq Ahmed', phone: '+919902044410', vehicleReg: 'KA03MN4410', ratingAvg: 4.9, etaMin: 0 },
    bids: [], createdAt: Date.parse('2026-06-26T11:15:00+05:30'),
  },
  {
    id: 'GN-5985', type: 'auction', tripType: 'outstation', vehicleType: 'truck',
    pickup: 'Peenya Industrial Area', drop: 'Hyderabad', distanceKm: 575, status: 'delivered',
    basePricePaise: 2867500, winningBidPaise: 2640000,
    driver: { name: 'Karnataka Roadlines', phone: '+918012345678', vehicleReg: 'KA01C5521', ratingAvg: 4.6, etaMin: 0 },
    bids: [], createdAt: Date.parse('2026-06-24T09:30:00+05:30'),
  },
];
