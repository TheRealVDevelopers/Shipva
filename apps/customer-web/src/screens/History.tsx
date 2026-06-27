import { useNavigate } from 'react-router-dom';
import { Gavel, Radio, ChevronRight, Package } from 'lucide-react';
import { Frame } from '../components/Frame.js';
import { BookingStatusBadge } from '../components/StatusBadge.js';
import { useStore } from '../lib/store.js';
import { rupees } from '../lib/format.js';

export function History() {
  const navigate = useNavigate();
  const { bookings } = useStore();

  return (
    <Frame title="Your trips" nav>
      <div className="space-y-3 p-4">
        {bookings.length === 0 && (
          <div className="flex flex-col items-center py-20 text-center text-sm text-neutral-500">
            <Package size={32} className="mb-2 text-neutral-300" /> No trips yet.
          </div>
        )}
        {bookings.map((b) => {
          const price = b.winningBidPaise ?? b.farePaise ?? b.basePricePaise ?? 0;
          const to = b.type === 'auction' && b.status === 'bidding' ? `/auction/${b.id}` : `/track/${b.id}`;
          return (
            <button key={b.id} onClick={() => navigate(to)} className="flex w-full items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 text-left">
              <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${b.type === 'auction' ? 'bg-orange-50 text-orange-600' : 'bg-primary-50 text-primary-600'}`}>
                {b.type === 'auction' ? <Gavel size={18} /> : <Radio size={18} />}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-neutral-500">{b.id}</span>
                  <BookingStatusBadge status={b.status} />
                </div>
                <div className="mt-0.5 truncate text-sm font-medium text-neutral-900">{b.pickup} → {b.drop}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-neutral-900">{rupees(price)}</div>
                <ChevronRight size={16} className="ml-auto text-neutral-300" />
              </div>
            </button>
          );
        })}
      </div>
    </Frame>
  );
}
