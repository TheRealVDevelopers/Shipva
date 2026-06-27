import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, Circle, Phone, Star, Truck, MapPin } from 'lucide-react';
import type { BookingStatus } from '@ground/shared-types';
import { Frame } from '../components/Frame.js';
import { useStore } from '../lib/store.js';
import { rupees } from '../lib/format.js';

const NEXT: Partial<Record<BookingStatus, BookingStatus>> = {
  searching: 'assigned',
  awarded: 'assigned',
  assigned: 'arrived',
  arrived: 'picked_up',
  picked_up: 'in_transit',
  in_transit: 'delivered',
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
  const { get, update } = useStore();
  const booking = get(id);

  // Auto-advance the trip so the live timeline feels real.
  useEffect(() => {
    if (!booking) return;
    const next = NEXT[booking.status];
    if (!next) return;
    const t = setTimeout(() => update(id, { status: next }), 3500);
    return () => clearTimeout(t);
  }, [id, booking, update]);

  if (!booking) return <Frame title="Tracking" back><p className="p-6 text-sm text-neutral-500">Trip not found.</p></Frame>;

  const idx = STEPS.findIndex((s) => s.key === booking.status);
  const price = booking.winningBidPaise ?? booking.farePaise ?? booking.basePricePaise ?? 0;

  return (
    <Frame title={`Trip ${booking.id}`} back>
      <div className="space-y-4 p-4">
        <div className="relative h-40 overflow-hidden rounded-xl bg-[radial-gradient(circle_at_30%_40%,rgba(15,61,114,0.10),transparent),radial-gradient(circle_at_70%_70%,rgba(245,130,32,0.10),transparent)] bg-neutral-100 ring-1 ring-neutral-200">
          <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-neutral-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            {booking.status === 'delivered' ? 'Delivered' : 'Live'}
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-primary-500 p-2.5 text-white shadow-lg"><Truck size={18} /></div>
        </div>

        {booking.driver && (
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700">
                {booking.driver.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </div>
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
              const done = idx >= i;
              const current = idx === i;
              return (
                <li key={s.key} className="flex items-center gap-3">
                  {done ? <CheckCircle2 size={18} className={current && s.key !== 'delivered' ? 'text-orange-500' : 'text-emerald-500'} /> : <Circle size={18} className="text-neutral-300" />}
                  <span className={`text-sm ${done ? 'font-medium text-neutral-900' : 'text-neutral-400'}`}>{s.label}</span>
                  {current && s.key !== 'delivered' && <span className="ml-auto text-[11px] text-orange-600">now</span>}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 text-sm">
          <Row label="Pickup" value={booking.pickup} icon={<MapPin size={13} className="text-emerald-600" />} />
          <Row label="Drop" value={booking.drop} icon={<MapPin size={13} className="text-rose-600" />} />
          <div className="mt-2 flex items-center justify-between border-t border-neutral-100 pt-2">
            <span className="text-neutral-500">{booking.type === 'auction' ? 'Winning price' : 'Fare'}</span>
            <span className="font-semibold text-neutral-900">{rupees(price)}</span>
          </div>
        </div>

        {booking.status === 'delivered' && (
          <div className="rounded-xl border border-neutral-200 bg-white p-4 text-center">
            <div className="text-sm font-medium text-neutral-900">Rate your driver</div>
            <div className="mt-2 flex justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={26} className={n <= 5 ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'} />)}
            </div>
          </div>
        )}
      </div>
    </Frame>
  );
}

function Row({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 py-1">
      {icon}
      <span className="text-[10px] uppercase tracking-wide text-neutral-400">{label}</span>
      <span className="ml-auto text-neutral-800">{value}</span>
    </div>
  );
}
