import { useNavigate } from 'react-router-dom';
import {
  MapPin, Navigation, Phone, CheckCircle2, Circle, Truck, PackageCheck,
} from 'lucide-react';
import { Frame } from '../components/Frame.js';
import { PrimaryButton } from '../components/Controls.js';
import { useStore, type JobStatus } from '../lib/store.js';
import { updateBooking } from '../lib/sharedStore.js';
import type { BookingStatus } from '@shipva/shared-types';
import { rupees } from '../lib/format.js';

const SHARED_NEXT: Partial<Record<JobStatus, BookingStatus>> = {
  assigned: 'arrived', arrived: 'picked_up', picked_up: 'in_transit', in_transit: 'delivered',
};

const STEPS: { key: JobStatus; label: string }[] = [
  { key: 'assigned', label: 'Heading to pickup' },
  { key: 'arrived', label: 'At pickup' },
  { key: 'picked_up', label: 'Picked up' },
  { key: 'in_transit', label: 'On the way' },
  { key: 'delivered', label: 'Delivered' },
];

const ACTION: Record<JobStatus, string> = {
  open: 'Accept',
  assigned: "I've arrived at pickup",
  arrived: 'Confirm pickup',
  picked_up: 'Start trip',
  in_transit: 'Mark delivered',
  delivered: 'Done',
};

export function Active() {
  const navigate = useNavigate();
  const { active, advance, complete } = useStore();

  if (!active) {
    return (
      <Frame title="Active job" nav>
        <div className="flex flex-col items-center py-24 text-center text-sm text-neutral-500">
          <PackageCheck size={32} className="mb-2 text-neutral-300" />
          No active job. Accept one from the feed.
          <button onClick={() => navigate('/feed')} className="mt-4 rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white">Find jobs</button>
        </div>
      </Frame>
    );
  }

  const idx = STEPS.findIndex((s) => s.key === active.status);
  const pay = active.farePaise ?? active.basePricePaise ?? 0;

  function onAction() {
    const next = SHARED_NEXT[active!.status];
    if (active!.shared && next) updateBooking(active!.id, { status: next });
    if (active!.status === 'in_transit') { complete(); navigate('/earnings'); }
    else advance();
  }

  return (
    <Frame title={`Job ${active.id}`} nav>
      <div className="space-y-4 p-4">
        <div className="relative h-36 overflow-hidden rounded-xl bg-[radial-gradient(circle_at_30%_40%,rgba(15,61,114,0.10),transparent),radial-gradient(circle_at_70%_70%,rgba(245,130,32,0.10),transparent)] bg-neutral-100 ring-1 ring-neutral-200">
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-primary-500 p-2.5 text-white shadow-lg"><Truck size={18} /></div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 rounded-lg bg-primary-50 py-2.5 text-sm font-semibold text-primary-700"><Navigation size={15} /> Navigate</a>
          <a href="tel:+918012345678" className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 py-2.5 text-sm font-semibold text-emerald-700"><Phone size={15} /> Call</a>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm text-neutral-800"><MapPin size={14} className="text-emerald-600" /> {active.pickup}</div>
            <div className="flex items-center gap-2 text-sm text-neutral-800"><MapPin size={14} className="text-rose-600" /> {active.drop}</div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3 text-sm">
            <span className="text-neutral-500">{active.customer ?? active.company} · {active.distanceKm} km</span>
            <span className="font-bold text-neutral-900">{rupees(pay)}</span>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <ol className="space-y-3">
            {STEPS.map((s, i) => {
              const done = idx >= i;
              const current = idx === i;
              return (
                <li key={s.key} className="flex items-center gap-3">
                  {done ? <CheckCircle2 size={18} className={current && s.key !== 'delivered' ? 'text-orange-500' : 'text-emerald-500'} /> : <Circle size={18} className="text-neutral-300" />}
                  <span className={`text-sm ${done ? 'font-medium text-neutral-900' : 'text-neutral-400'}`}>{s.label}</span>
                </li>
              );
            })}
          </ol>
        </div>

        <PrimaryButton onClick={onAction}>{ACTION[active.status]}</PrimaryButton>
      </div>
    </Frame>
  );
}
