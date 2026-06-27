import { createContext, useContext, useState, type ReactNode } from 'react';
import type { BookingStatus, BookingType, TripType, VehicleType } from '@ground/shared-types';

export interface CxBid {
  id: string;
  name: string;
  ratingAvg: number;
  vehicleReg: string;
  amountPaise: number;
}

export interface CxDriver {
  name: string;
  phone: string;
  vehicleReg: string;
  ratingAvg: number;
  etaMin: number;
}

export interface CxBooking {
  id: string;
  type: BookingType;
  tripType: TripType;
  vehicleType: VehicleType;
  pickup: string;
  drop: string;
  distanceKm: number;
  status: BookingStatus;
  farePaise?: number;
  basePricePaise?: number;
  winningBidPaise?: number;
  driver?: CxDriver;
  bids: CxBid[];
  createdAt: number;
}

export type NewBooking = Omit<CxBooking, 'id' | 'bids' | 'createdAt'> & { bids?: CxBid[] };

interface Store {
  bookings: CxBooking[];
  add: (b: NewBooking) => string;
  update: (id: string, patch: Partial<CxBooking>) => void;
  get: (id: string) => CxBooking | undefined;
}

const Ctx = createContext<Store | null>(null);

let seq = 6000;
const nextId = () => `GN-${(seq += 1)}`;

export function StoreProvider({ children, seed }: { children: ReactNode; seed: CxBooking[] }) {
  const [bookings, setBookings] = useState<CxBooking[]>(seed);

  const add: Store['add'] = (b) => {
    const id = nextId();
    const booking: CxBooking = { ...b, id, bids: b.bids ?? [], createdAt: Date.now() };
    setBookings((prev) => [booking, ...prev]);
    return id;
  };

  const update: Store['update'] = (id, patch) =>
    setBookings((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const get: Store['get'] = (id) => bookings.find((x) => x.id === id);

  return <Ctx.Provider value={{ bookings, add, update, get }}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used within StoreProvider');
  return s;
}
