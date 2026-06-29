// Local mock helpers for the customer app (driver/bid simulation, addresses).

export interface CxDriver {
  name: string;
  phone: string;
  vehicleReg: string;
  ratingAvg: number;
}

export interface CxBid {
  id: string;
  name: string;
  ratingAvg: number;
  vehicleReg: string;
  amountPaise: number;
}

export const SAVED_ADDRESSES = [
  { label: 'Home', line: '12, 4th Cross, Koramangala 5th Block' },
  { label: 'Shop', line: 'Leela Stores, Indiranagar 100ft Rd' },
  { label: 'Warehouse', line: 'Unit 7, Peenya Industrial Area, Phase 2' },
];

const DRIVERS: CxDriver[] = [
  { name: 'Ravi Kumar', phone: '+919902011234', vehicleReg: 'KA01AB1234', ratingAvg: 4.8 },
  { name: 'Suresh Nayak', phone: '+919902027782', vehicleReg: 'KA05CJ7782', ratingAvg: 4.6 },
  { name: 'Rafiq Ahmed', phone: '+919902044410', vehicleReg: 'KA03MN4410', ratingAvg: 4.9 },
  { name: 'Anil Hegde', phone: '+919902090087', vehicleReg: 'KA02GH9087', ratingAvg: 4.5 },
];

const BIDDERS = [
  { name: 'Karnataka Roadlines', ratingAvg: 4.6, vehicleReg: 'KA01C5521' },
  { name: 'Sri Venkateshwara Transport', ratingAvg: 4.8, vehicleReg: 'KA02D9930' },
  { name: 'Bharadwaj Carriers', ratingAvg: 4.3, vehicleReg: 'KA51F1207' },
  { name: 'Deccan Freight Movers', ratingAvg: 4.7, vehicleReg: 'KA09H8810' },
];

export function randomDriver(): CxDriver {
  return DRIVERS[Math.floor(Math.random() * DRIVERS.length)]!;
}

export function makeBid(floorPaise: number, index: number): CxBid {
  const b = BIDDERS[index % BIDDERS.length]!;
  const drop = 0.88 + Math.random() * 0.1;
  return {
    id: `bid-${index}-${Math.round(floorPaise * drop)}`,
    name: b.name,
    ratingAvg: b.ratingAvg,
    vehicleReg: b.vehicleReg,
    amountPaise: Math.round((floorPaise * drop) / 1000) * 1000,
  };
}
