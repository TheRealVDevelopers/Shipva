import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ChevronDown, Search, Radio, Gavel, ChevronRight } from 'lucide-react';
import { VEHICLE_TYPES, type TripType } from '@shipva/shared-types';
import { isActiveBooking } from '@shipva/shared-logic';
import { Frame } from '../components/Frame.js';
import { VehicleArt } from '../components/art.js';
import { BookingStatusBadge } from '../components/StatusBadge.js';
import { useBookings } from '../lib/sharedStore.js';
import { rupees } from '../lib/format.js';

export function Home() {
  const navigate = useNavigate();
  const bookings = useBookings();
  const [trip, setTrip] = useState<TripType>('intercity');
  const active = bookings.find((b) => isActiveBooking(b.status));
  const recent = bookings.slice(0, 3);

  return (
    <Frame nav>
      <div className="bg-primary-600 px-4 pb-9 pt-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] text-primary-200">Pickup from</div>
            <button className="flex items-center gap-1 text-sm font-bold"><MapPin size={14} /> Koramangala 5th Block <ChevronDown size={14} /></button>
          </div>
          <button onClick={() => navigate('/profile')} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 font-bold">AR</button>
        </div>
      </div>

      <div className="-mt-6 px-4">
        <button onClick={() => navigate('/book', { state: { trip } })} className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-card ring-1 ring-neutral-100">
          <Search size={18} className="text-primary-500" />
          <span className="flex-1 text-sm font-semibold text-neutral-500">Where do you want to send?</span>
          <span className="h-2.5 w-2.5 rounded-sm bg-accent-500" />
        </button>
      </div>

      <div className="space-y-6 p-4">
        <div className="rounded-xl bg-white p-1 ring-1 ring-neutral-200">
          <div className="grid grid-cols-2">
            {(['intercity', 'outstation'] as TripType[]).map((t) => (
              <button key={t} onClick={() => setTrip(t)} className={`rounded-lg py-2 text-sm font-bold capitalize transition-colors ${trip === t ? 'bg-primary-500 text-white shadow-sm' : 'text-neutral-500'}`}>
                {t === 'intercity' ? 'Within city' : 'Outstation'}
              </button>
            ))}
          </div>
        </div>

        {active && (
          <button onClick={() => navigate(active.type === 'auction' && active.status === 'bidding' ? `/auction/${active.id}` : `/track/${active.id}`)} className="flex w-full items-center gap-3 rounded-2xl border border-primary-200 bg-primary-50 p-3 text-left">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-500 text-white"><MapPin size={16} /></span>
            <div className="flex-1"><div className="text-sm font-bold text-neutral-900">Active trip · {active.id}</div><div className="text-xs text-neutral-500">{active.pickup} → {active.drop}</div></div>
            <BookingStatusBadge status={active.status} />
          </button>
        )}

        <div>
          <div className="mb-2 text-sm font-bold text-neutral-900">Pick a vehicle</div>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {VEHICLE_TYPES.map((v) => (
              <button key={v.type} onClick={() => navigate('/book', { state: { trip, vehicle: v.type } })} className="flex w-[88px] shrink-0 flex-col items-center gap-1.5 rounded-2xl border border-neutral-200 bg-white p-3 hover:border-primary-300">
                <VehicleArt type={v.type} className="h-9 w-14" />
                <span className="text-[11px] font-bold text-neutral-700">{v.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-sm font-bold text-neutral-900">How do you want to book?</div>
          <div className="grid grid-cols-2 gap-3">
            <Method onClick={() => navigate('/book', { state: { trip } })} icon={<Radio size={20} />} tone="primary" title="Quick book" sub="Nearby drivers accept" />
            <Method onClick={() => navigate('/auction', { state: { trip } })} icon={<Gavel size={20} />} tone="accent" title="Auction" sub="Drivers bid on price" />
          </div>
        </div>

        {recent.length > 0 && (
          <div>
            <div className="mb-2 flex items-center justify-between"><span className="text-sm font-bold text-neutral-900">Recent trips</span><button onClick={() => navigate('/history')} className="text-xs font-semibold text-primary-600">See all</button></div>
            <div className="space-y-2">
              {recent.map((b) => (
                <button key={b.id} onClick={() => navigate(`/track/${b.id}`)} className="flex w-full items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 text-left">
                  <VehicleArt type={b.vehicleType} className="h-6 w-10 shrink-0" />
                  <div className="flex-1 min-w-0"><div className="truncate text-sm font-semibold text-neutral-900">{b.drop || b.pickup}</div><div className="text-xs text-neutral-500">{b.id}</div></div>
                  <div className="text-right"><div className="text-sm font-bold text-neutral-900">{rupees(b.farePaise ?? b.basePricePaise ?? 0)}</div><ChevronRight size={14} className="ml-auto text-neutral-300" /></div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Frame>
  );
}

function Method({ onClick, icon, title, sub, tone }: { onClick: () => void; icon: React.ReactNode; title: string; sub: string; tone: 'primary' | 'accent' }) {
  const ring = tone === 'primary' ? 'text-primary-600 bg-primary-50' : 'text-accent-600 bg-accent-50';
  return (
    <button onClick={onClick} className="rounded-2xl border border-neutral-200 bg-white p-3.5 text-left hover:border-primary-300">
      <span className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl ${ring}`}>{icon}</span>
      <div className="text-sm font-bold text-neutral-900">{title}</div>
      <div className="text-[11px] text-neutral-500">{sub}</div>
    </button>
  );
}
