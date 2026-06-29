import { useNavigate } from 'react-router-dom';
import { Gavel, Radio, ChevronRight } from 'lucide-react';
import { Frame } from '../components/Frame.js';
import { BookingStatusBadge } from '../components/StatusBadge.js';
import { EmptyArt } from '../components/art.js';
import { useBookings } from '../lib/sharedStore.js';
import { rupees } from '../lib/format.js';

export function History() {
  const navigate = useNavigate();
  const bookings = useBookings();

  return (
    <Frame title="Your trips" nav>
      <div className="space-y-3 p-4">
        {bookings.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center text-sm text-neutral-500">
            <EmptyArt className="mb-3 h-24 w-24" /> No trips yet.
          </div>
        )}
        {bookings.map((b) => {
          const price = b.farePaise ?? b.basePricePaise ?? 0;
          const to = b.type === 'auction' && b.status === 'bidding' ? `/auction/${b.id}` : `/track/${b.id}`;
          return (
            <button key={b.id} onClick={() => navigate(to)} className="flex w-full items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 text-left">
              <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${b.type === 'auction' ? 'bg-accent-50 text-accent-600' : 'bg-primary-50 text-primary-600'}`}>
                {b.type === 'auction' ? <Gavel size={18} /> : <Radio size={18} />}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><span className="font-mono text-xs text-neutral-500">{b.id}</span><BookingStatusBadge status={b.status} /></div>
                <div className="mt-0.5 truncate text-sm font-medium text-neutral-900">{b.pickup} → {b.drop}</div>
              </div>
              <div className="text-right"><div className="text-sm font-semibold text-neutral-900">{rupees(price)}</div><ChevronRight size={16} className="ml-auto text-neutral-300" /></div>
            </button>
          );
        })}
      </div>
    </Frame>
  );
}
