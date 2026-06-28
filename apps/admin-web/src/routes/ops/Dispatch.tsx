import { MapPin, Phone, Clock, ArrowRight, Search, Radio } from 'lucide-react';
import { OpsLayout } from '../../components/layout/OpsLayout.js';
import { Card, CardHeader, CardBody } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { bookings, drivers } from '../../lib/mocks.js';
import { rupees, relativeTime } from '../../lib/format.js';
import { VehicleArt } from '../../components/art.js';

const NOW = Date.parse('2026-06-27T15:30:00+05:30');

export function Dispatch() {
  const searching = bookings.filter((b) => b.type === 'instant' && b.status === 'searching');
  const available = drivers.filter((d) => d.dutyStatus === 'online' && d.kycStatus === 'verified');

  return (
    <OpsLayout title="Dispatch board" subtitle="Concierge MVP — alert nearby drivers, assign manually">
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
              <Radio size={14} className="text-orange-500" /> Searching for a driver · {searching.length}
            </h2>
            <span className="flex items-center gap-1 text-xs text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live</span>
          </div>
          {searching.map((b) => (
            <Card key={b.bookingId} className="ring-orange-200">
              <CardBody>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-mono text-primary-700">{b.bookingId}</div>
                    <div className="text-sm font-medium text-neutral-900 mt-0.5">{b.customer}</div>
                  </div>
                  <div className="text-right">
                    <Badge tone={b.source === 'whatsapp' ? 'success' : 'info'}>{b.source}</Badge>
                    <div className="text-sm font-semibold text-neutral-900 mt-1">{rupees(b.farePaise ?? 0)}</div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-neutral-600 flex items-start gap-1.5"><MapPin size={11} className="text-emerald-600 mt-0.5" /><div>{b.pickup}</div></div>
                <div className="text-xs text-neutral-600 flex items-start gap-1.5 mt-1"><MapPin size={11} className="text-rose-600 mt-0.5" /><div>{b.drop}</div></div>
                <div className="mt-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                    <Clock size={11} /> {relativeTime(b.createdAt, NOW)}
                    <Badge tone="neutral" className="!text-[10px]">{b.vehicleType.replaceAll('_', ' ')}</Badge>
                    <span>{b.distanceKm} km</span>
                  </div>
                  <Button size="sm">Assign <ArrowRight size={11} /></Button>
                </div>
              </CardBody>
            </Card>
          ))}
          {searching.length === 0 && <p className="text-sm text-neutral-500 py-6 text-center">No bookings searching right now.</p>}
        </div>

        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader title="Live map" subtitle="Phase 2 — Realtime Database driver positions" action={<span className="text-xs text-neutral-500">{available.length} available</span>} />
            <div className="h-72 relative bg-[radial-gradient(circle_at_30%_40%,rgba(15,61,114,0.08),transparent),radial-gradient(circle_at_70%_60%,rgba(245,130,32,0.08),transparent)] bg-neutral-100 rounded-b-lg">
              <Pin x="24%" y="38%" label="Rafiq" tone="online" />
              <Pin x="52%" y="60%" label="Suresh" tone="online" />
              <Pin x="68%" y="32%" label="Anil" tone="online" />
              <Pin x="38%" y="72%" label="Ravi" tone="onjob" />
              <Pin x="80%" y="50%" label="Vikram" tone="onjob" />
              <div className="absolute bottom-3 left-3 right-3 rounded-md bg-white/95 backdrop-blur ring-1 ring-neutral-200 shadow-sm p-3 text-xs">
                <div className="font-medium text-neutral-900 mb-1">Bengaluru — launch zones</div>
                <div className="grid grid-cols-3 gap-1.5 text-neutral-600">
                  <span>Whitefield · 2</span><span>Koramangala · 1</span><span>HSR · 1</span>
                  <span>Indiranagar · 1</span><span>E-City · 1</span><span>Peenya · 0</span>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title={`Available drivers · ${available.length}`} subtitle="Verified + online — tap a searching job to assign" action={
              <div className="flex items-center gap-2 rounded-md bg-neutral-50 ring-1 ring-neutral-200 px-2 py-1 text-xs">
                <Search size={11} className="text-neutral-400" />
                <input className="bg-transparent w-28 outline-none placeholder:text-neutral-400" placeholder="Search…" />
              </div>
            } />
            <CardBody className="space-y-2">
              {available.map((d) => (
                <div key={d.driverId} className="flex items-center gap-3 rounded-md ring-1 ring-inset ring-neutral-200 p-2.5 hover:ring-primary-200 transition-colors">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold text-sm">
                    {d.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-neutral-900 truncate">{d.name}</div>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-0.5">
                      <span className="flex items-center gap-0.5"><Phone size={9} /> {d.phone.slice(-5)}</span>
                      <span className="inline-flex items-center gap-1 capitalize"><VehicleArt type={d.vehicleType} className="h-4 w-6" /> {d.vehicleType.replaceAll('_', ' ')}</span>
                      <span>★ {d.ratingAvg}</span>
                      <span>{d.zone}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="secondary">Ping</Button>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    </OpsLayout>
  );
}

function Pin({ x, y, label, tone }: { x: string; y: string; label: string; tone: 'online' | 'onjob' }) {
  const dot = tone === 'onjob' ? 'bg-orange-500' : 'bg-emerald-500';
  return (
    <div className="absolute" style={{ left: x, top: y, transform: 'translate(-50%, -100%)' }}>
      <div className="flex flex-col items-center">
        <div className="rounded-md bg-white ring-1 ring-neutral-200 px-2 py-0.5 text-[10px] font-medium text-neutral-700 shadow-sm whitespace-nowrap">{label}</div>
        <div className={`mt-1 h-2.5 w-2.5 rounded-full ring-2 ring-white ${dot} animate-pulse`} />
      </div>
    </div>
  );
}
