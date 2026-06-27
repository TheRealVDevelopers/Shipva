import type { Job } from './store.js';

export const DRIVER = {
  name: 'Ravi Kumar',
  phone: '+91 99020 11234',
  vehicleType: 'mini_truck' as const,
  vehicleReg: 'KA01AB1234',
  zone: 'Koramangala',
  ratingAvg: 4.8,
  ratingCount: 412,
  kyc: 'verified' as const,
};

export const seedFeed: Job[] = [
  { id: 'GN-7101', kind: 'instant', vehicleType: 'mini_truck', pickup: 'Koramangala 5th Block', drop: 'BTM Layout 2nd Stage', distanceKm: 6.4, customer: 'Anita R.', farePaise: 23080, status: 'open', minsAgo: 1 },
  { id: 'GN-7102', kind: 'instant', vehicleType: 'mini_truck', pickup: 'Forum Mall, Koramangala', drop: 'Ejipura', distanceKm: 3.1, customer: 'Sneha Foods', farePaise: 15820, status: 'open', minsAgo: 3 },
  { id: 'GN-7103', kind: 'instant', vehicleType: 'mini_truck', pickup: 'HSR Sector 2', drop: 'Sarjapur Road', distanceKm: 5.2, customer: 'Imran P.', farePaise: 20440, status: 'open', minsAgo: 6 },
  { id: 'GN-7201', kind: 'auction', vehicleType: 'mini_truck', pickup: 'Indiranagar', drop: 'Whitefield', distanceKm: 14.5, company: 'Leela Stores', basePricePaise: 52000, status: 'open', minsAgo: 22 },
  { id: 'GN-7202', kind: 'auction', vehicleType: 'mini_truck', pickup: 'Peenya', drop: 'Electronic City', distanceKm: 31, company: 'Vexa Polymers (KASSIA)', basePricePaise: 98000, status: 'open', minsAgo: 40 },
  { id: 'GN-7301', kind: 'backhaul', vehicleType: 'mini_truck', pickup: 'Hosur (return leg)', drop: 'Koramangala', distanceKm: 42, company: 'Deccan Freight Movers', basePricePaise: 60000, status: 'open', minsAgo: 65 },
  { id: 'GN-7302', kind: 'backhaul', vehicleType: 'mini_truck', pickup: 'Tumakuru (return leg)', drop: 'Peenya', distanceKm: 70, company: 'Karnataka Roadlines', basePricePaise: 88000, status: 'open', minsAgo: 88 },
];

export const seedCompleted: Job[] = [
  { id: 'GN-7090', kind: 'instant', vehicleType: 'mini_truck', pickup: 'Indiranagar', drop: 'Domlur', distanceKm: 3.6, customer: 'Leela Stores', status: 'delivered', payoutPaise: 16920, minsAgo: 120 },
  { id: 'GN-7088', kind: 'instant', vehicleType: 'mini_truck', pickup: 'Koramangala', drop: 'Jayanagar', distanceKm: 5.0, customer: 'Deepa N.', status: 'delivered', payoutPaise: 19800, minsAgo: 180 },
  { id: 'GN-7085', kind: 'auction', vehicleType: 'mini_truck', pickup: 'Whitefield', drop: 'KR Puram', distanceKm: 9.2, company: 'Sneha Foods', status: 'delivered', payoutPaise: 38760, minsAgo: 300 },
];
