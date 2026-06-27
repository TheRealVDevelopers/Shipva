// Mock data for the admin/dispatch preview UI.
// Placeholder only — the real app reads from Firestore. Money in paise.
// "Now" = 27 Jun 2026, 3:30 PM IST.

import type {
  BookingStatus, BookingType, TripType, VehicleType,
  DutyStatus, KycStatus, VerifyStatus,
} from '@ground/shared-types';

export const ZONES = ['Whitefield', 'Koramangala', 'HSR Layout', 'Indiranagar', 'Electronic City', 'Peenya'];

export interface MockBooking {
  bookingId: string;
  type: BookingType;
  status: BookingStatus;
  tripType: TripType;
  vehicleType: VehicleType;
  zone: string;
  source: 'app' | 'whatsapp';
  customer: string;
  customerPhone: string;
  pickup: string;
  drop: string;
  distanceKm: number;
  farePaise?: number;
  basePricePaise?: number;
  bidCount?: number;
  auctionClosesAt?: string;
  driverName?: string;
  driverPhone?: string;
  vehicleReg?: string;
  createdAt: string;
  updatedAt: string;
}

export const bookings: MockBooking[] = [
  { bookingId: 'GN-5001', type: 'instant', status: 'searching', tripType: 'intercity', vehicleType: 'mini_truck', zone: 'Koramangala', source: 'whatsapp', customer: 'Anita Rao', customerPhone: '+91 98860 41200', pickup: 'Koramangala 5th Block', drop: 'BTM Layout 2nd Stage', distanceKm: 6.4, farePaise: 23080, createdAt: '2026-06-27T15:22:00+05:30', updatedAt: '2026-06-27T15:22:00+05:30' },
  { bookingId: 'GN-5002', type: 'instant', status: 'searching', tripType: 'intercity', vehicleType: 'auto', zone: 'HSR Layout', source: 'app', customer: 'Imran Pasha', customerPhone: '+91 99016 33098', pickup: 'HSR Sector 2', drop: 'Sarjapur Road', distanceKm: 4.1, farePaise: 8920, createdAt: '2026-06-27T15:26:00+05:30', updatedAt: '2026-06-27T15:26:00+05:30' },
  { bookingId: 'GN-5003', type: 'instant', status: 'in_transit', tripType: 'intercity', vehicleType: 'tempo', zone: 'Whitefield', source: 'app', customer: 'Sneha Foods', customerPhone: '+91 97410 55621', pickup: 'Whitefield ITPL', drop: 'KR Puram', distanceKm: 9.2, farePaise: 38760, driverName: 'Ravi Kumar', driverPhone: '+91 99020 11234', vehicleReg: 'KA01AB1234', createdAt: '2026-06-27T14:05:00+05:30', updatedAt: '2026-06-27T15:10:00+05:30' },
  { bookingId: 'GN-5004', type: 'auction', status: 'bidding', tripType: 'outstation', vehicleType: 'truck', zone: 'Peenya', source: 'app', customer: 'Bharat Steels', customerPhone: '+91 80889 71045', pickup: 'Peenya Industrial Area', drop: 'Hyderabad', distanceKm: 575, basePricePaise: 2867500, bidCount: 4, auctionClosesAt: '2026-06-27T18:00:00+05:30', createdAt: '2026-06-27T12:40:00+05:30', updatedAt: '2026-06-27T15:18:00+05:30' },
  { bookingId: 'GN-5005', type: 'auction', status: 'bidding', tripType: 'outstation', vehicleType: 'pickup', zone: 'Electronic City', source: 'app', customer: 'KASSIA — Vexa Polymers', customerPhone: '+91 99452 21100', pickup: 'Electronic City Phase 1', drop: 'Chennai', distanceKm: 348, basePricePaise: 1192500, bidCount: 2, auctionClosesAt: '2026-06-27T17:00:00+05:30', createdAt: '2026-06-27T13:20:00+05:30', updatedAt: '2026-06-27T15:05:00+05:30' },
  { bookingId: 'GN-5006', type: 'instant', status: 'delivered', tripType: 'intercity', vehicleType: 'mini_truck', zone: 'Indiranagar', source: 'whatsapp', customer: 'Leela Stores', customerPhone: '+91 96320 88451', pickup: 'Indiranagar 100ft Rd', drop: 'Domlur', distanceKm: 3.6, farePaise: 16920, driverName: 'Rafiq Ahmed', driverPhone: '+91 99020 44410', vehicleReg: 'KA03MN4410', createdAt: '2026-06-27T11:15:00+05:30', updatedAt: '2026-06-27T12:02:00+05:30' },
  { bookingId: 'GN-5007', type: 'auction', status: 'awarded', tripType: 'outstation', vehicleType: 'reefer', zone: 'Whitefield', source: 'app', customer: 'FreshCo Dairy', customerPhone: '+91 98456 10092', pickup: 'Whitefield Cold Hub', drop: 'Mangaluru', distanceKm: 352, basePricePaise: 2914000, bidCount: 5, driverName: 'Vikram Singh', driverPhone: '+91 99020 33321', vehicleReg: 'KA51TR3321', createdAt: '2026-06-27T09:30:00+05:30', updatedAt: '2026-06-27T14:40:00+05:30' },
  { bookingId: 'GN-5008', type: 'instant', status: 'cancelled', tripType: 'intercity', vehicleType: 'bike', zone: 'Koramangala', source: 'app', customer: 'Deepa N.', customerPhone: '+91 90080 12345', pickup: 'Koramangala 1st Block', drop: 'Ejipura', distanceKm: 2.2, farePaise: 4260, createdAt: '2026-06-27T10:50:00+05:30', updatedAt: '2026-06-27T10:58:00+05:30' },
];

export interface MockDriver {
  driverId: string;
  name: string;
  phone: string;
  vehicleType: VehicleType;
  vehicleReg: string;
  zone: string;
  dutyStatus: DutyStatus;
  kycStatus: KycStatus;
  ratingAvg: number;
  ratingCount: number;
  tripsToday: number;
  earningsTodayPaise: number;
}

export const drivers: MockDriver[] = [
  { driverId: 'd1', name: 'Ravi Kumar', phone: '+91 99020 11234', vehicleType: 'tempo', vehicleReg: 'KA01AB1234', zone: 'Whitefield', dutyStatus: 'on_job', kycStatus: 'verified', ratingAvg: 4.8, ratingCount: 412, tripsToday: 6, earningsTodayPaise: 184000 },
  { driverId: 'd2', name: 'Suresh Nayak', phone: '+91 99020 27782', vehicleType: 'mini_truck', vehicleReg: 'KA05CJ7782', zone: 'Koramangala', dutyStatus: 'online', kycStatus: 'verified', ratingAvg: 4.6, ratingCount: 288, tripsToday: 4, earningsTodayPaise: 96000 },
  { driverId: 'd3', name: 'Rafiq Ahmed', phone: '+91 99020 44410', vehicleType: 'mini_truck', vehicleReg: 'KA03MN4410', zone: 'Indiranagar', dutyStatus: 'online', kycStatus: 'verified', ratingAvg: 4.9, ratingCount: 521, tripsToday: 9, earningsTodayPaise: 246000 },
  { driverId: 'd4', name: 'Anil Hegde', phone: '+91 99020 90087', vehicleType: 'auto', vehicleReg: 'KA02GH9087', zone: 'HSR Layout', dutyStatus: 'online', kycStatus: 'verified', ratingAvg: 4.5, ratingCount: 173, tripsToday: 3, earningsTodayPaise: 41000 },
  { driverId: 'd5', name: 'Vikram Singh', phone: '+91 99020 33321', vehicleType: 'reefer', vehicleReg: 'KA51TR3321', zone: 'Whitefield', dutyStatus: 'on_job', kycStatus: 'verified', ratingAvg: 4.7, ratingCount: 96, tripsToday: 1, earningsTodayPaise: 0 },
  { driverId: 'd6', name: 'Manjunath G', phone: '+91 99020 55119', vehicleType: 'pickup', vehicleReg: 'KA04PL5567', zone: 'Electronic City', dutyStatus: 'online', kycStatus: 'pending', ratingAvg: 0, ratingCount: 0, tripsToday: 0, earningsTodayPaise: 0 },
  { driverId: 'd7', name: 'Faizal Khan', phone: '+91 99020 77665', vehicleType: 'bike', vehicleReg: 'KA02IK2210', zone: 'Koramangala', dutyStatus: 'offline', kycStatus: 'pending', ratingAvg: 0, ratingCount: 0, tripsToday: 0, earningsTodayPaise: 0 },
  { driverId: 'd8', name: 'Prakash R', phone: '+91 99020 88776', vehicleType: 'tempo', vehicleReg: 'KA09TR1188', zone: 'Peenya', dutyStatus: 'offline', kycStatus: 'rejected', ratingAvg: 3.9, ratingCount: 44, tripsToday: 0, earningsTodayPaise: 0 },
];

export interface MockBid {
  bidId: string;
  bookingId: string;
  driverName: string;
  ratingAvg: number;
  vehicleReg: string;
  amountPaise: number;
  createdAt: string;
}

export const bids: MockBid[] = [
  { bidId: 'b1', bookingId: 'GN-5004', driverName: 'Karnataka Roadlines', ratingAvg: 4.6, vehicleReg: 'KA01C5521', amountPaise: 2750000, createdAt: '2026-06-27T13:10:00+05:30' },
  { bidId: 'b2', bookingId: 'GN-5004', driverName: 'Sri Venkateshwara Transport', ratingAvg: 4.8, vehicleReg: 'KA02D9930', amountPaise: 2690000, createdAt: '2026-06-27T14:02:00+05:30' },
  { bidId: 'b3', bookingId: 'GN-5004', driverName: 'Bharadwaj Carriers', ratingAvg: 4.3, vehicleReg: 'KA51F1207', amountPaise: 2820000, createdAt: '2026-06-27T14:35:00+05:30' },
  { bidId: 'b4', bookingId: 'GN-5004', driverName: 'Ravi Kumar', ratingAvg: 4.8, vehicleReg: 'KA01AB1234', amountPaise: 2640000, createdAt: '2026-06-27T15:18:00+05:30' },
  { bidId: 'b5', bookingId: 'GN-5005', driverName: 'Anil Hegde', ratingAvg: 4.5, vehicleReg: 'KA02GH9087', amountPaise: 1150000, createdAt: '2026-06-27T14:20:00+05:30' },
  { bidId: 'b6', bookingId: 'GN-5005', driverName: 'Chennai Express Logistics', ratingAvg: 4.7, vehicleReg: 'TN09K3321', amountPaise: 1098000, createdAt: '2026-06-27T15:05:00+05:30' },
];

export interface MockTransporter {
  transporterId: string;
  company: string;
  gstin: string;
  zone: string;
  verifyStatus: VerifyStatus;
  ratingAvg: number;
  fleetSize: number;
}

export const transporters: MockTransporter[] = [
  { transporterId: 't1', company: 'Karnataka Roadlines', gstin: '29ABCDE1234F1Z5', zone: 'Peenya', verifyStatus: 'verified', ratingAvg: 4.6, fleetSize: 18 },
  { transporterId: 't2', company: 'Sri Venkateshwara Transport', gstin: '29PQRST5678G2Z1', zone: 'Whitefield', verifyStatus: 'verified', ratingAvg: 4.8, fleetSize: 11 },
  { transporterId: 't3', company: 'Bharadwaj Carriers', gstin: '29LMNOP9012H3Z7', zone: 'Electronic City', verifyStatus: 'pending', ratingAvg: 0, fleetSize: 6 },
  { transporterId: 't4', company: 'Deccan Freight Movers', gstin: '29UVWXY3456J4Z9', zone: 'Peenya', verifyStatus: 'verified', ratingAvg: 4.4, fleetSize: 24 },
];

export interface MockLoadPost {
  loadPostId: string;
  company: string;
  origin: string;
  destination: string;
  vehicleType: VehicleType;
  date: string;
  basePricePaise: number;
  status: 'open' | 'claimed' | 'connected';
  isBackhaul: boolean;
}

export const loadPosts: MockLoadPost[] = [
  { loadPostId: 'l1', company: 'Karnataka Roadlines', origin: 'Bengaluru', destination: 'Pune', vehicleType: 'truck', date: '2026-06-29', basePricePaise: 4200000, status: 'open', isBackhaul: false },
  { loadPostId: 'l2', company: 'Deccan Freight Movers', origin: 'Hyderabad', destination: 'Bengaluru', vehicleType: 'truck', date: '2026-06-28', basePricePaise: 2600000, status: 'open', isBackhaul: true },
  { loadPostId: 'l3', company: 'Sri Venkateshwara Transport', origin: 'Bengaluru', destination: 'Chennai', vehicleType: 'pickup', date: '2026-06-28', basePricePaise: 1150000, status: 'claimed', isBackhaul: false },
  { loadPostId: 'l4', company: 'Deccan Freight Movers', origin: 'Mangaluru', destination: 'Bengaluru', vehicleType: 'reefer', date: '2026-06-30', basePricePaise: 2800000, status: 'open', isBackhaul: true },
];

export interface MockTruckPost {
  truckPostId: string;
  company: string;
  location: string;
  vehicleType: VehicleType;
  availableDate: string;
  returnRoute: string;
  status: 'open' | 'claimed' | 'connected';
}

export const truckPosts: MockTruckPost[] = [
  { truckPostId: 'k1', company: 'Karnataka Roadlines', location: 'Pune', vehicleType: 'truck', availableDate: '2026-06-30', returnRoute: 'Pune → Bengaluru', status: 'open' },
  { truckPostId: 'k2', company: 'Bharadwaj Carriers', location: 'Bengaluru', vehicleType: 'tempo', availableDate: '2026-06-28', returnRoute: 'Bengaluru → Hubballi', status: 'open' },
  { truckPostId: 'k3', company: 'Deccan Freight Movers', location: 'Chennai', vehicleType: 'pickup', availableDate: '2026-06-29', returnRoute: 'Chennai → Bengaluru', status: 'connected' },
];

export const counters = {
  liveBookings: 5,
  onlineDrivers: 4,
  onJobDrivers: 2,
  openAuctions: 2,
  pendingKyc: 2,
  deliveredToday: 38,
  gmvTodayPaise: 4920000,
  exchangeOpen: 6,
  backhaulFills: 3,
};
