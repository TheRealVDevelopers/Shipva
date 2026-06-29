import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock, Star, Truck, Trophy, CheckCircle2, Gavel } from 'lucide-react';
import { Frame } from '../components/Frame.js';
import { PrimaryButton } from '../components/Controls.js';
import { useBooking, updateBooking } from '../lib/sharedStore.js';
import { makeBid, type CxBid } from '../lib/mocks.js';
import { rupees } from '../lib/format.js';

export function AuctionDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const booking = useBooking(id);
  const [bids, setBids] = useState<CxBid[]>([]);

  // Simulate competing bids arriving over the window (local — not shared).
  useEffect(() => {
    if (!booking || booking.status !== 'bidding') return;
    const floor = booking.basePricePaise ?? 0;
    const timers = [1200, 2400, 3600, 5000].map((ms, i) => setTimeout(() => setBids((prev) => [...prev, makeBid(floor, i)]), ms));
    return () => timers.forEach(clearTimeout);
  }, [id, booking?.status]);

  if (!booking) return <Frame title="Auction" back><p className="p-6 text-sm text-neutral-500">Auction not found.</p></Frame>;

  const sorted = [...bids].sort((a, b) => a.amountPaise - b.amountPaise);
  const awarded = booking.status === 'awarded' && booking.driver;

  function choose(bid: CxBid) {
    updateBooking(id, { status: 'awarded', driver: { name: bid.name, phone: '+918012345678', vehicleReg: bid.vehicleReg, ratingAvg: bid.ratingAvg }, farePaise: bid.amountPaise });
  }

  return (
    <Frame title="Auction" back>
      <div className="space-y-4 p-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-mono text-xs text-primary-700">{booking.id}</div>
              <div className="mt-0.5 text-sm font-semibold text-neutral-900">{booking.pickup} → {booking.drop}</div>
              <div className="text-xs text-neutral-500 capitalize">{booking.vehicleType.replaceAll('_', ' ')} · {booking.distanceKm} km</div>
            </div>
            {!awarded && <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700"><Clock size={11} /> closes 6h</span>}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3 text-sm"><span className="text-neutral-500">Your base price</span><span className="font-semibold text-neutral-900">{rupees(booking.basePricePaise ?? 0)}</span></div>
        </div>

        {awarded ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"><CheckCircle2 size={16} /> Awarded to {booking.driver!.name} · {rupees(booking.farePaise ?? 0)}</div>
            <PrimaryButton onClick={() => navigate(`/track/${id}`)}>Track live</PrimaryButton>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-1"><span className="text-sm font-semibold text-neutral-900">{sorted.length} bids</span>{sorted[0] && <span className="text-xs text-emerald-700">best {rupees(sorted[0].amountPaise)}</span>}</div>
            {sorted.length === 0 && <div className="flex flex-col items-center py-10 text-center text-sm text-neutral-500"><Gavel size={28} className="mb-2 animate-pulse text-neutral-300" /> Waiting for drivers to bid…</div>}
            <div className="space-y-2">
              {sorted.map((bid, i) => (
                <div key={bid.id} className={`rounded-xl border bg-white p-3 ${i === 0 ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-neutral-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">{bid.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}</div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm font-semibold text-neutral-900">{bid.name}</div>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                        <span className="flex items-center gap-0.5"><Star size={10} className="fill-amber-400 text-amber-400" /> {bid.ratingAvg}</span>
                        <span className="flex items-center gap-0.5"><Truck size={10} /> {bid.vehicleReg}</span>
                        {i === 0 && <span className="font-medium text-emerald-600">lowest</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold text-neutral-900">{rupees(bid.amountPaise)}</div>
                      <button onClick={() => choose(bid)} className={`mt-1 inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold ${i === 0 ? 'bg-primary-500 text-white' : 'bg-neutral-100 text-neutral-700'}`}>{i === 0 && <Trophy size={11} />} Choose</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Frame>
  );
}
