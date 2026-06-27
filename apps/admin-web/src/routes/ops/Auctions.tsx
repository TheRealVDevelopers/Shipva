import { Gavel, Clock, Star, Trophy, MapPin } from 'lucide-react';
import { OpsLayout } from '../../components/layout/OpsLayout.js';
import { Card, CardHeader, CardBody } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { bookings, bids } from '../../lib/mocks.js';
import { rupees, relativeTime } from '../../lib/format.js';

const NOW = Date.parse('2026-06-27T15:30:00+05:30');

export function Auctions() {
  const open = bookings.filter((b) => b.type === 'auction' && b.status === 'bidding');

  return (
    <OpsLayout title="Auctions" subtitle="Customers set a floor; drivers & transporters compete on price">
      <div className="space-y-6">
        {open.map((b) => {
          const myBids = bids
            .filter((x) => x.bookingId === b.bookingId)
            .sort((a, c) => a.amountPaise - c.amountPaise);
          const best = myBids[0];
          return (
            <Card key={b.bookingId}>
              <CardHeader
                title={`${b.bookingId} · ${b.pickup} → ${b.drop}`}
                subtitle={`${b.customer} · ${b.vehicleType.replaceAll('_', ' ')} · ${b.distanceKm} km`}
                action={
                  <span className="flex items-center gap-1.5 text-xs text-amber-700">
                    <Clock size={12} /> closes {b.auctionClosesAt ? relativeTime(b.auctionClosesAt, NOW).replace(' ago', '') : '—'}
                  </span>
                }
              />
              <CardBody>
                <div className="grid sm:grid-cols-3 gap-3 mb-4">
                  <Stat label="Floor price" value={rupees(b.basePricePaise ?? 0)} />
                  <Stat label="Bids" value={String(b.bidCount ?? myBids.length)} />
                  <Stat label="Best bid" value={best ? rupees(best.amountPaise) : '—'} tone="success" />
                </div>

                <div className="space-y-2">
                  {myBids.map((bid, i) => (
                    <div key={bid.bidId} className={`flex items-center gap-3 rounded-md p-2.5 ring-1 ring-inset ${i === 0 ? 'bg-emerald-50/50 ring-emerald-200' : 'ring-neutral-200'}`}>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xs font-semibold">
                        {bid.driverName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-neutral-900 truncate">{bid.driverName}</div>
                        <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                          <span className="flex items-center gap-0.5"><Star size={9} className="fill-amber-400 text-amber-400" /> {bid.ratingAvg}</span>
                          <span>{bid.vehicleReg}</span>
                          <span>{relativeTime(bid.createdAt, NOW)}</span>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-neutral-900">{rupees(bid.amountPaise)}</div>
                      <Button size="sm" variant={i === 0 ? 'primary' : 'secondary'}>
                        {i === 0 ? <><Trophy size={11} /> Award</> : 'Award'}
                      </Button>
                    </div>
                  ))}
                  {myBids.length === 0 && <p className="text-sm text-neutral-500 py-3 text-center">No bids yet.</p>}
                </div>
              </CardBody>
            </Card>
          );
        })}
        {open.length === 0 && (
          <Card><CardBody className="py-10 text-center text-sm text-neutral-500"><Gavel className="mx-auto mb-2 text-neutral-300" /> No open auctions right now.</CardBody></Card>
        )}

        <p className="text-xs text-neutral-500 flex items-center gap-1.5">
          <MapPin size={11} /> Awarding a bid moves the booking to <span className="font-medium">awarded</span>; the winning driver then confirms to take the job.
        </p>
      </div>
    </OpsLayout>
  );
}

function Stat({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: 'neutral' | 'success' }) {
  return (
    <div className="rounded-md bg-neutral-50 ring-1 ring-inset ring-neutral-200 py-2.5 text-center">
      <div className={`text-base font-semibold ${tone === 'success' ? 'text-emerald-700' : 'text-neutral-900'}`}>{value}</div>
      <div className="text-[10px] text-neutral-500 mt-0.5">{label}</div>
    </div>
  );
}
