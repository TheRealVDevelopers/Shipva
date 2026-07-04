import { useState } from 'react';
import { Plus, FileText, MapPin, Search } from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card } from '../../components/ui/Card.js';
import { KpiCard } from '../../components/ui/KpiCard.js';
import { Table, THead, Th, TBody, Tr, Td } from '../../components/ui/Table.js';
import { Badge, type BadgeTone } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { rupees } from '../../lib/format.js';
import { trips, osCounters, type TripStatus } from '../../lib/mocks.js';

const TRIP_BADGE: Record<TripStatus, { label: string; tone: BadgeTone }> = {
  assigned: { label: 'Assigned', tone: 'info' },
  loading: { label: 'Loading', tone: 'accent' },
  in_transit: { label: 'In transit', tone: 'primary' },
  at_drop: { label: 'At drop', tone: 'primary' },
  pod_pending: { label: 'POD pending', tone: 'warning' },
  closed: { label: 'Closed', tone: 'success' },
};

const FILTERS = ['All', 'Active', 'Closed'] as const;

export function Trips() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const shown = trips.filter((t) =>
    filter === 'All' ? true : filter === 'Closed' ? t.status === 'closed' : t.status !== 'closed',
  );
  const active = trips.filter((t) => t.status !== 'closed').length;
  const freightTotal = trips.reduce((s, t) => s + t.freightPaise, 0);

  return (
    <PartnerLayout title="Trips" subtitle="Consignments & lorry receipts (LR)">
      <div className="space-y-6">
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Active trips" value={String(active)} hint="in progress" tone="primary" />
          <KpiCard label="Trips · MTD" value={String(osCounters.tripsMtd)} hint="this month" tone="accent" />
          <KpiCard label="Freight billed" value={rupees(freightTotal)} hint="recent" tone="success" />
          <KpiCard label="POD pending" value={String(trips.filter((t) => t.status === 'pod_pending').length)} hint="need proof" tone="danger" />
        </section>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-5 py-3">
            <div className="flex items-center gap-1">
              {FILTERS.map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${filter === f ? 'bg-primary-500 text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}>
                  {f}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-1.5 text-xs text-neutral-400 ring-1 ring-inset ring-neutral-200">
                <Search size={13} /> Search LR / driver
              </div>
              <Button size="sm"><Plus size={13} /> New trip</Button>
            </div>
          </div>

          <Table>
            <THead>
              <Tr>
                <Th>LR / Date</Th><Th>Route</Th><Th>Driver · Vehicle</Th><Th>Material</Th>
                <Th className="text-right">Freight</Th><Th>E-way</Th><Th>Status</Th><Th></Th>
              </Tr>
            </THead>
            <TBody>
              {shown.map((t) => (
                <Tr key={t.lr}>
                  <Td>
                    <div className="font-mono text-xs font-bold text-neutral-900">{t.lr}</div>
                    <div className="text-[11px] text-neutral-400">{t.date}</div>
                  </Td>
                  <Td className="text-neutral-700">
                    <span className="inline-flex items-center gap-1"><MapPin size={11} className="text-emerald-500" />{t.from}</span>
                    <span className="mx-1 text-neutral-300">→</span>
                    <span className="inline-flex items-center gap-1"><MapPin size={11} className="text-rose-500" />{t.to}</span>
                  </Td>
                  <Td>
                    <div className="font-semibold text-neutral-800">{t.driver}</div>
                    <div className="font-mono text-[11px] text-neutral-400">{t.vehicleReg}</div>
                  </Td>
                  <Td className="text-neutral-600">{t.material}<div className="text-[11px] text-neutral-400">{t.weightKg.toLocaleString('en-IN')} kg</div></Td>
                  <Td className="text-right font-bold text-neutral-900">{rupees(t.freightPaise)}</Td>
                  <Td>{t.ewayBill ? <Badge tone="success">Linked</Badge> : <Badge tone="warning">Pending</Badge>}</Td>
                  <Td><Badge tone={TRIP_BADGE[t.status].tone}>{TRIP_BADGE[t.status].label}</Badge></Td>
                  <Td><button className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-700"><FileText size={12} /> LR</button></Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Card>
      </div>
    </PartnerLayout>
  );
}
