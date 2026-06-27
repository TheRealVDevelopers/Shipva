import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, Gavel, ChevronRight, MapPin } from 'lucide-react';
import type { TripType } from '@ground/shared-types';
import { Frame } from '../components/Frame.js';
import { useStore } from '../lib/store.js';
import { BookingStatusBadge } from '../components/StatusBadge.js';
import { isActiveBooking } from '@ground/shared-logic';

export function Home() {
  const navigate = useNavigate();
  const { bookings } = useStore();
  const [trip, setTrip] = useState<TripType>('intercity');
  const active = bookings.find((b) => isActiveBooking(b.status));

  return (
    <Frame title="Book a delivery" nav>
      <div className="space-y-5 p-4">
        <div className="rounded-xl bg-white p-1 ring-1 ring-neutral-200">
          <div className="grid grid-cols-2">
            {(['intercity', 'outstation'] as TripType[]).map((t) => (
              <button
                key={t}
                onClick={() => setTrip(t)}
                className={`rounded-lg py-2.5 text-sm font-medium capitalize transition-colors ${
                  trip === t ? 'bg-primary-500 text-white shadow-sm' : 'text-neutral-600'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {active && (
          <button onClick={() => navigate(active.type === 'auction' && active.status === 'bidding' ? `/auction/${active.id}` : `/track/${active.id}`)}
            className="flex w-full items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 p-3 text-left">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-500 text-white"><MapPin size={16} /></span>
            <div className="flex-1">
              <div className="text-sm font-semibold text-neutral-900">Active trip · {active.id}</div>
              <div className="text-xs text-neutral-500">{active.pickup} → {active.drop}</div>
            </div>
            <BookingStatusBadge status={active.status} />
          </button>
        )}

        <div className="space-y-3">
          <Method
            onClick={() => navigate('/book', { state: { trip } })}
            icon={<Radio size={22} />}
            tone="primary"
            title="Quick booking"
            sub="Request now · nearby drivers accept"
          />
          <Method
            onClick={() => navigate('/auction', { state: { trip } })}
            icon={<Gavel size={22} />}
            tone="accent"
            title="Auction bidding"
            sub="Set a budget · drivers compete on price"
          />
        </div>

        <p className="px-1 text-center text-xs text-neutral-400">
          Prefer WhatsApp? Message us and book in chat — no app needed.
        </p>
      </div>
    </Frame>
  );
}

function Method({ onClick, icon, title, sub, tone }: {
  onClick: () => void; icon: React.ReactNode; title: string; sub: string; tone: 'primary' | 'accent';
}) {
  const ring = tone === 'primary' ? 'text-primary-600 bg-primary-50' : 'text-orange-600 bg-orange-50';
  return (
    <button onClick={onClick} className="flex w-full items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-neutral-300">
      <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${ring}`}>{icon}</span>
      <div className="flex-1">
        <div className="text-base font-semibold text-neutral-900">{title}</div>
        <div className="text-xs text-neutral-500">{sub}</div>
      </div>
      <ChevronRight size={18} className="text-neutral-300" />
    </button>
  );
}
