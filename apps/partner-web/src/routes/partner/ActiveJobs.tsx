import { MapPin, Phone, Navigation, CheckCircle2, Circle } from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card, CardBody } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { BookingStatusBadge } from '../../components/ui/StatusBadge.js';
import { VehicleArt } from '../../components/art.js';
import { activeJobs } from '../../lib/mocks.js';
import type { BookingStatus } from '@ground/shared-types';

const STEPS: { key: BookingStatus; label: string }[] = [
  { key: 'assigned', label: 'To pickup' },
  { key: 'arrived', label: 'At pickup' },
  { key: 'picked_up', label: 'Picked up' },
  { key: 'in_transit', label: 'In transit' },
  { key: 'delivered', label: 'Delivered' },
];

export function ActiveJobs() {
  return (
    <PartnerLayout title="Active Jobs" subtitle="Trips your drivers are running now">
      <div className="grid gap-4 lg:grid-cols-2 stagger">
        {activeJobs.map((j) => {
          const idx = STEPS.findIndex((s) => s.key === j.status);
          return (
            <Card key={j.id}>
              <CardBody>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <VehicleArt type={j.vehicleType} className="h-9 w-13 shrink-0" />
                    <div>
                      <div className="font-mono text-xs text-neutral-500">{j.id}</div>
                      <div className="text-sm font-extrabold text-neutral-900">{j.from} → {j.to}</div>
                    </div>
                  </div>
                  <BookingStatusBadge status={j.status} />
                </div>

                <div className="mt-3 flex items-center gap-2 text-sm">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                    {j.driverName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </span>
                  <span className="font-semibold text-neutral-900">{j.driverName}</span>
                  <span className="ml-auto text-xs text-neutral-500">ETA {j.etaMin} min</span>
                </div>

                {/* timeline */}
                <ol className="mt-4 flex items-center justify-between">
                  {STEPS.map((s, i) => {
                    const done = idx >= i;
                    return (
                      <li key={s.key} className="flex flex-1 flex-col items-center text-center">
                        <div className="flex w-full items-center">
                          {i > 0 && <div className={`h-0.5 flex-1 ${i <= idx ? 'bg-primary-500' : 'bg-neutral-200'}`} />}
                          {done ? <CheckCircle2 size={16} className={i === idx ? 'text-accent-500' : 'text-primary-500'} /> : <Circle size={16} className="text-neutral-300" />}
                          {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 ${i < idx ? 'bg-primary-500' : 'bg-neutral-200'}`} />}
                        </div>
                        <span className={`mt-1 text-[9px] ${done ? 'font-bold text-neutral-700' : 'text-neutral-400'}`}>{s.label}</span>
                      </li>
                    );
                  })}
                </ol>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button size="sm" variant="secondary"><Navigation size={12} /> Track</Button>
                  <Button size="sm" variant="secondary"><Phone size={12} /> Call driver</Button>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </PartnerLayout>
  );
}
