/**
 * Shared browser-storage data layer — the no-backend "one system in one browser".
 * All co-located apps (same origin) read/write the SAME localStorage key, so a
 * booking made in the customer app shows up live in the driver app, and status
 * changes flow both ways. Persists across refresh. BroadcastChannel gives instant
 * cross-tab updates; the `storage` event is the fallback.
 */
import { useEffect, useState } from 'react';
import type { BookingStatus, VehicleType } from '@ground/shared-types';

export interface SharedBooking {
  id: string;
  type: 'instant' | 'auction';
  vehicleType: VehicleType;
  pickup: string;
  drop: string;
  distanceKm: number;
  farePaise?: number;
  basePricePaise?: number;
  status: BookingStatus;
  customerName: string;
  driver?: { name: string; phone: string; vehicleReg: string; ratingAvg: number };
  createdAt: number;
}

const KEY = 'gn:bookings:v1';
const channel: BroadcastChannel | null =
  typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('gn') : null;

function read(): SharedBooking[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as SharedBooking[];
  } catch {
    return [];
  }
}

function write(list: SharedBooking[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  channel?.postMessage('changed');
}

export function getBookings(): SharedBooking[] {
  return read().sort((a, b) => b.createdAt - a.createdAt);
}

export function getBooking(id: string): SharedBooking | undefined {
  return read().find((b) => b.id === id);
}

export function addBooking(b: SharedBooking): string {
  write([b, ...read()]);
  return b.id;
}

export function updateBooking(id: string, patch: Partial<SharedBooking>) {
  write(read().map((b) => (b.id === id ? { ...b, ...patch } : b)));
}

export function subscribe(cb: () => void): () => void {
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) cb(); };
  const onMsg = () => cb();
  window.addEventListener('storage', onStorage);
  channel?.addEventListener('message', onMsg);
  return () => {
    window.removeEventListener('storage', onStorage);
    channel?.removeEventListener('message', onMsg);
  };
}

/** React hook — re-renders whenever shared bookings change anywhere. */
export function useBookings(): SharedBooking[] {
  const [list, setList] = useState<SharedBooking[]>(getBookings);
  useEffect(() => subscribe(() => setList(getBookings())), []);
  return list;
}

export function useBooking(id: string | undefined): SharedBooking | undefined {
  const all = useBookings();
  return id ? all.find((b) => b.id === id) : undefined;
}

let seq = Date.now() % 100000;
export function nextBookingId(): string {
  seq += 1;
  return `GN-${seq}`;
}

/** Seed a couple of past trips the first time, so history isn't empty. */
export function seedIfEmpty() {
  if (read().length > 0) return;
  write([
    {
      id: 'GN-5990', type: 'instant', vehicleType: 'mini_truck', pickup: 'Indiranagar 100ft Rd',
      drop: 'Domlur', distanceKm: 3.6, farePaise: 16920, status: 'delivered', customerName: 'Anita Rao',
      driver: { name: 'Rafiq Ahmed', phone: '+919902044410', vehicleReg: 'KA03MN4410', ratingAvg: 4.9 },
      createdAt: Date.parse('2026-06-26T11:15:00+05:30'),
    },
  ]);
}
