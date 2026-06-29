import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, Circle, Phone, Star, Truck, MapPin } from 'lucide-react';
import type { BookingStatus } from '@ground/shared-types';
import { Frame } from '../components/Frame.js';
import { MapArt } from '../components/art.js';
import { useBooking, updateBooking, getBooking } from '../lib/sharedStore.js';
import { rupees } from '../lib/format.js';

const NEXT: Partial<Record<BookingStatus, BookingStatus>> = {
  searching: 'assigned', awarded: 'assigned', assigned: 'arrived',
  arrived: 'picked_up', picked_up: 'in_transit', in_transit: 'delivered',
};

const STEPS: { key: BookingStatus; label: string }[] = [
  { key: 'assigned', label: 'Driver assigned' },
  { key: 'arrived', label: 'At pickup' },
  { key: 'picked_up', label: 'Picked up' },
  { key: 'in_transit', label: 'On the way' },
  { key: 'delivered', label: 'Delivered' },
];

export function Tracking() {
  const { id = '' } = useParams();
  const booking = useBooking(id);

  // Fallback progression so the trip completes even if no driver app is driving it.
  useEffect(() => {
    if (!booking) return;
    const next = NEXT[booking.status];
    if (!next) return;
    const t = setTimeout(() => {
      const b = getBooking(id);
      if (b && b.status === booking.status) updateBooking(id, { status: next });
    }, 4000);
    return () => clearTimeout(t);
  }, [id, booking]);

  if (!booking) return <Frame title="Tracking" back><p className="p-6 text-sm text-neutral-500">Trip not found.</p></Frame>;

  const idx = STEPS.findIndex((s) => s.key === booking.status);
  const price = booking.farePaise ?? booking.basePricePaise ?? 0;

  return (
    <Frame title={`Trip ${booking.id}`} back>
      <div className="space-y-4 p-4">
        <div className="relative overflow-hidden rounded-xl ring-1 ring-neutral-200">
          <MapArt className="h-40 w-full" />
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-neutral-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> {booking.status === 'delivered' ? 'Delivered' : 'Live'}
          </div>
        </div>

        {booking.driver && (
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700">{booking.driver.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}</div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-neutral-900">{booking.driver.name}</div>
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <span className="flex items-center gap-0.5"><Star size={11} className="fill-amber-400 text-amber-400" /> {booking.driver.ratingAvg}</span>
                  <span className="flex items-center gap-0.5"><Truck size={11} /> {booking.driver.vehicleReg}</span>
                </div>
              </div>
              <a href={`tel:${booking.driver.phone}`} className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-white"><Phone size={16} /></a>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <ol className="space-y-3">
            {STEPS.map((s, i) => {
              const done = idx >= i; const current = idx === i;
              return (
                <li key={s.key} className="flex items-center gap-3">
                  {done ? <CheckCircle2 size={18} className={current && s.key !== 'delivered' ? 'text-accent-500' : 'text-emerald-500'} /> : <Circle size={18} className="text-neutral-300" />}
                  <span className={`text-sm ${done ? 'font-medium text-neutral-900' : 'text-neutral-400'}`}>{s.label}</span>
                  {current && s.key !== 'delivered' && <span className="ml-auto text-[11px] text-accent-600">now</span>}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 text-sm">
          <div className="flex items-center gap-2 py-1"><MapPin size={13} className="text-emerald-600" /><span className="text-[10px] uppercase tracking-wide text-neutral-400">Pickup</span><span className="ml-auto text-neutral-800">{booking.pickup}</span></div>
          <div className="flex items-center gap-2 py-1"><MapPin size={13} className="text-rose-600" /><span className="text-[10px] uppercase tracking-wide text-neutral-400">Drop</span><span className="ml-auto text-neutral-800">{booking.drop}</span></div>
          <div className="mt-2 flex items-center justify-between border-t border-neutral-100 pt-2"><span className="text-neutral-500">Fare</span><span className="font-semibold text-neutral-900">{rupees(price)}</span></div>
        </div>
      </div>
    </Frame>
  );
}
