import { useState } from 'react';
import { MapPin, Clock, ArrowRight, Gavel, ArrowLeftRight, Radio } from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card, CardBody } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { VehicleArt } from '../../components/art.js';
import { loadBoard, type LoadKind } from '../../lib/mocks.js';
import { rupees } from '../../lib/format.js';

const TABS: { key: 'all' | LoadKind; label: string }[] = [
  { key: 'all', label: 'All loads' },
  { key: 'instant', label: 'Instant' },
  { key: 'auction', label: 'Auction' },
  { key: 'backhaul', label: 'Backhaul' },
];

export function LoadBoard() {
  const [tab, setTab] = useState<'all' | LoadKind>('all');
  const rows = loadBoard.filter((l) => tab === 'all' || l.kind === tab);

  return (
    <PartnerLayout title="Load Board" subtitle="Available loads — claim instant & backhaul, bid on auctions">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-1">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${tab === t.key ? 'bg-primary-500 text-white' : 'bg-white text-neutral-700 ring-1 ring-inset ring-neutral-200 hover:bg-neutral-50'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2 stagger">
          {rows.map((l) => (
            <Card key={l.id} className={l.kind === 'backhaul' ? 'ring-accent-200' : ''}>
              <CardBody>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Kind kind={l.kind} />
                    <span className="font-mono text-xs text-neutral-500">{l.id}</span>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] text-neutral-400"><Clock size={10} /> {l.minsAgo}m ago</span>
                </div>

                <div className="mt-2.5 flex items-center gap-3">
                  <VehicleArt type={l.vehicleType} className="h-10 w-14 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-neutral-900"><MapPin size={12} className="text-emerald-600" /> {l.from}</div>
                    <div className="flex items-center gap-1.5 text-sm font-bold text-neutral-900"><MapPin size={12} className="text-rose-600" /> {l.to}</div>
                    <div className="mt-0.5 text-[11px] text-neutral-500 capitalize">{l.poster} · {l.vehicleType.replaceAll('_', ' ')} · {l.distanceKm} km · {l.date}</div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3">
                  <div>
                    <div className="text-[10px] text-neutral-400">{l.kind === 'auction' ? `floor · ${l.bidCount} bids` : 'price'}</div>
                    <div className="text-lg font-extrabold text-neutral-900">{rupees(l.basePricePaise)}</div>
                  </div>
                  {l.kind === 'auction' ? (
                    <Button size="sm"><Gavel size={12} /> Place bid</Button>
                  ) : (
                    <Button size="sm">Claim load <ArrowRight size={12} /></Button>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
        <p className="text-xs text-neutral-500">{rows.length} loads · claimed loads go to <span className="font-semibold">My Fleet</span> to assign a driver.</p>
      </div>
    </PartnerLayout>
  );
}

function Kind({ kind }: { kind: LoadKind }) {
  if (kind === 'auction') return <Badge tone="accent"><Gavel size={10} /> Auction</Badge>;
  if (kind === 'backhaul') return <Badge tone="accent"><ArrowLeftRight size={10} /> Backhaul</Badge>;
  return <Badge tone="success"><Radio size={10} /> Instant</Badge>;
}
