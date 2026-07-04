// Mock data for the partner dashboard preview. Money in paise.
import type { BookingStatus, DutyStatus, KycStatus, VehicleType, VerifyStatus } from '@shipva/shared-types';

export const partner = {
  company: 'Karnataka Roadlines',
  contact: 'Mahesh Gowda',
  phone: '+91 99452 11000',
  region: 'Peenya corridor · Bengaluru',
  gstin: '29ABCDE1234F1Z5',
  verifyStatus: 'verified' as VerifyStatus,
  ratingAvg: 4.6,
  ratingCount: 318,
};

export const subscription = {
  tier: 'Growth',
  pricePaise: 399900,
  driverSlots: 20,
  driversUsed: 12,
  renewalOn: '15 Jul 2026',
  trial: false,
};

export const PLANS = [
  { tier: 'Starter', pricePaise: 149900, drivers: 5, blurb: 'New owners getting started' },
  { tier: 'Growth', pricePaise: 399900, drivers: 20, blurb: 'Scaling fleets', current: true },
  { tier: 'Pro', pricePaise: 899900, drivers: 60, blurb: 'Large transporters', features: ['Priority loads', 'Smart match'] },
];

export const counters = {
  activeJobs: 5,
  driversOnline: 7,
  loadsToClaim: 9,
  earningsMonthPaise: 38640000,
};

export interface FleetDriver {
  id: string; name: string; phone: string; vehicleReg: string; vehicleType: VehicleType;
  dutyStatus: DutyStatus; kycStatus: KycStatus; ratingAvg: number; tripsToday: number;
}
export const fleetDrivers: FleetDriver[] = [
  { id: 'fd1', name: 'Ramesh Yadav', phone: '+91 99020 51001', vehicleReg: 'KA01C5521', vehicleType: 'truck', dutyStatus: 'on_job', kycStatus: 'verified', ratingAvg: 4.7, tripsToday: 2 },
  { id: 'fd2', name: 'Sathish Reddy', phone: '+91 99020 51002', vehicleReg: 'KA02D9930', vehicleType: 'pickup', dutyStatus: 'online', kycStatus: 'verified', ratingAvg: 4.5, tripsToday: 3 },
  { id: 'fd3', name: 'Naveen Kumar', phone: '+91 99020 51003', vehicleReg: 'KA51F1207', vehicleType: 'tempo', dutyStatus: 'online', kycStatus: 'verified', ratingAvg: 4.8, tripsToday: 1 },
  { id: 'fd4', name: 'Iqbal Sharief', phone: '+91 99020 51004', vehicleReg: 'KA09H8810', vehicleType: 'truck', dutyStatus: 'on_job', kycStatus: 'verified', ratingAvg: 4.4, tripsToday: 1 },
  { id: 'fd5', name: 'Babu Rao', phone: '+91 99020 51005', vehicleReg: 'KA05K2245', vehicleType: 'mini_truck', dutyStatus: 'offline', kycStatus: 'pending', ratingAvg: 0, tripsToday: 0 },
  { id: 'fd6', name: 'Lokesh M', phone: '+91 99020 51006', vehicleReg: 'KA03P7782', vehicleType: 'tempo', dutyStatus: 'online', kycStatus: 'verified', ratingAvg: 4.6, tripsToday: 4 },
];

export interface Truck {
  id: string; reg: string; type: VehicleType; capacityKg: number; status: 'available' | 'on_trip' | 'maintenance'; docsOk: boolean;
}
export const trucks: Truck[] = [
  { id: 't1', reg: 'KA01C5521', type: 'truck', capacityKg: 7000, status: 'on_trip', docsOk: true },
  { id: 't2', reg: 'KA02D9930', type: 'pickup', capacityKg: 2500, status: 'available', docsOk: true },
  { id: 't3', reg: 'KA51F1207', type: 'tempo', capacityKg: 1500, status: 'available', docsOk: true },
  { id: 't4', reg: 'KA09H8810', type: 'truck', capacityKg: 7000, status: 'on_trip', docsOk: true },
  { id: 't5', reg: 'KA05K2245', type: 'mini_truck', capacityKg: 850, status: 'maintenance', docsOk: false },
];

export type LoadKind = 'instant' | 'auction' | 'backhaul';
export interface Load {
  id: string; from: string; to: string; poster: string; vehicleType: VehicleType;
  distanceKm: number; date: string; basePricePaise: number; kind: LoadKind; bidCount?: number; minsAgo: number;
}
export const loadBoard: Load[] = [
  { id: 'GN-8101', from: 'Peenya', to: 'Hosur', poster: 'Bharat Steels', vehicleType: 'truck', distanceKm: 48, date: 'Today', basePricePaise: 520000, kind: 'instant', minsAgo: 4 },
  { id: 'GN-8102', from: 'Bengaluru', to: 'Chennai', poster: 'Vexa Polymers (KASSIA)', vehicleType: 'pickup', distanceKm: 348, date: 'Tomorrow', basePricePaise: 1192500, kind: 'auction', bidCount: 3, minsAgo: 26 },
  { id: 'GN-8103', from: 'Hosur (return)', to: 'Peenya', poster: 'Deccan Freight', vehicleType: 'truck', distanceKm: 42, date: 'Today', basePricePaise: 300000, kind: 'backhaul', minsAgo: 38 },
  { id: 'GN-8104', from: 'Bengaluru', to: 'Hyderabad', poster: 'FreshCo Dairy', vehicleType: 'reefer', distanceKm: 575, date: '28 Jun', basePricePaise: 2914000, kind: 'auction', bidCount: 5, minsAgo: 52 },
  { id: 'GN-8105', from: 'Whitefield', to: 'Electronic City', poster: 'Leela Stores', vehicleType: 'tempo', distanceKm: 31, date: 'Today', basePricePaise: 98000, kind: 'instant', minsAgo: 60 },
  { id: 'GN-8106', from: 'Tumakuru (return)', to: 'Peenya', poster: 'Karnataka Roadlines', vehicleType: 'mini_truck', distanceKm: 70, date: 'Tomorrow', basePricePaise: 88000, kind: 'backhaul', minsAgo: 80 },
];

export interface ActiveJob {
  id: string; from: string; to: string; driverName: string; vehicleType: VehicleType; status: BookingStatus; etaMin: number;
}
export const activeJobs: ActiveJob[] = [
  { id: 'GN-8090', from: 'Peenya', to: 'Electronic City', driverName: 'Ramesh Yadav', vehicleType: 'truck', status: 'in_transit', etaMin: 22 },
  { id: 'GN-8088', from: 'Whitefield', to: 'KR Puram', driverName: 'Iqbal Sharief', vehicleType: 'truck', status: 'picked_up', etaMin: 35 },
  { id: 'GN-8086', from: 'Bengaluru', to: 'Hosur', driverName: 'Sathish Reddy', vehicleType: 'pickup', status: 'arrived', etaMin: 48 },
  { id: 'GN-8084', from: 'Peenya', to: 'Yelahanka', driverName: 'Lokesh M', vehicleType: 'tempo', status: 'assigned', etaMin: 12 },
];

export interface EarningRow {
  id: string; from: string; to: string; driverName: string; vehicleType: VehicleType; payoutPaise: number; date: string;
}
export const earnings: EarningRow[] = [
  { id: 'GN-8071', from: 'Peenya', to: 'Hosur', driverName: 'Ramesh Yadav', vehicleType: 'truck', payoutPaise: 510000, date: '26 Jun' },
  { id: 'GN-8068', from: 'Bengaluru', to: 'Chennai', driverName: 'Sathish Reddy', vehicleType: 'pickup', payoutPaise: 1150000, date: '25 Jun' },
  { id: 'GN-8060', from: 'Whitefield', to: 'Mysuru', driverName: 'Naveen Kumar', vehicleType: 'tempo', payoutPaise: 412000, date: '24 Jun' },
  { id: 'GN-8055', from: 'Peenya', to: 'Tumakuru', driverName: 'Lokesh M', vehicleType: 'tempo', payoutPaise: 268000, date: '24 Jun' },
  { id: 'GN-8049', from: 'Bengaluru', to: 'Hyderabad', driverName: 'Iqbal Sharief', vehicleType: 'truck', payoutPaise: 2640000, date: '22 Jun' },
];

export const payouts = [
  { id: 'PO-204', period: '16–22 Jun', amountPaise: 4820000, status: 'settled', on: '23 Jun' },
  { id: 'PO-198', period: '9–15 Jun', amountPaise: 5140000, status: 'settled', on: '16 Jun' },
  { id: 'PO-191', period: '2–8 Jun', amountPaise: 3960000, status: 'settled', on: '9 Jun' },
];
