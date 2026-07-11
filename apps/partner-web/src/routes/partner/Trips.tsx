import { useState } from 'react';
import { Plus, FileText, MapPin, Search } from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card } from '../../components/ui/Card.js';
import { KpiCard } from '../../components/ui/KpiCard.js';
import { Table, THead, Th, TBody, Tr, Td } from '../../components/ui/Table.js';
import { Badge, type BadgeTone } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Modal, Field, TextInput, Select, Row } from '../../components/ui/Modal.js';
import { rupees } from '../../lib/format.js';
import { osCounters, type TripStatus } from '../../lib/mocks.js';
import { useStore, todayLabel } from '../../lib/store.js';
import { useNotify } from '../../lib/notify.js';
import { printLR } from '../../lib/print.js';

const TRIP_BADGE: Record<TripStatus, { label: string; tone: BadgeTone }> = {
  assigned: { label: 'Assigned', tone: 'info' },
  loading: { label: 'Loading', tone: 'accent' },
  in_transit: { label: 'In transit', tone: 'primary' },
  at_drop: { label: 'At drop', tone: 'primary' },
  pod_pending: { label: 'POD pending', tone: 'warning' },
  closed: { label: 'Closed', tone: 'success' },
};

const FILTERS = ['All', 'Active', 'Closed'] as const;
const EMPTY = { from: '', to: '', driver: '', vehicleReg: '', material: '', weight: '', freight: '' };

export function Trips() {
  const { trips, drivers, trucks, addTrip } = useStore();
  const { push } = useNotify();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(EMPTY);

  const shown = trips
    .filter((t) => (filter === 'All' ? true : filter === 'Closed' ? t.status === 'closed' : t.status !== 'closed'))
    .filter((t) => (q ? `${t.lr} ${t.driver} ${t.from} ${t.to}`.toLowerCase().includes(q.toLowerCase()) : true));
  const active = trips.filter((t) => t.status !== 'closed').length;
  const freightTotal = trips.reduce((s, t) => s + t.freightPaise, 0);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const valid = f.from && f.to && f.driver && f.vehicleReg && Number(f.freight) > 0;

  function submit() {
    if (!valid) return;
    addTrip({
      date: todayLabel(), from: f.from, to: f.to, driver: f.driver, vehicleReg: f.vehicleReg,
      material: f.material || 'General goods', weightKg: Number(f.weight) || 0,
      freightPaise: Math.round(Number(f.freight) * 100), status: 'assigned', ewayBill: false,
    });
    push({ title: 'Trip created', body: `${f.from} → ${f.to} assigned to ${f.driver}.`, tone: 'success' });
    setF(EMPTY); setOpen(false);
  }

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
              {FILTERS.map((x) => (
                <button key={x} onClick={() => setFilter(x)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${filter === x ? 'bg-primary-500 text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}>
                  {x}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-1.5 ring-1 ring-inset ring-neutral-200">
                <Search size={13} className="text-neutral-400" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search LR / driver" className="w-36 bg-transparent text-xs text-neutral-700 outline-none placeholder:text-neutral-400" />
              </div>
              <Button size="sm" onClick={() => setOpen(true)}><Plus size={13} /> New trip</Button>
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
                  <Td><button onClick={() => printLR(t)} className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-700"><FileText size={12} /> LR</button></Td>
                </Tr>
              ))}
              {shown.length === 0 && (
                <Tr><Td className="py-8 text-center text-sm text-neutral-400">No trips match.</Td></Tr>
              )}
            </TBody>
          </Table>
        </Card>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New trip / LR" subtitle="Create a consignment" onSubmit={submit} submitLabel="Create trip" submitDisabled={!valid}>
        <Row>
          <Field label="Pickup"><TextInput value={f.from} onChange={set('from')} placeholder="Peenya" /></Field>
          <Field label="Drop"><TextInput value={f.to} onChange={set('to')} placeholder="Hosur" /></Field>
        </Row>
        <Row>
          <Field label="Driver">
            <Select value={f.driver} onChange={set('driver')}>
              <option value="">Select driver</option>
              {drivers.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
            </Select>
          </Field>
          <Field label="Vehicle">
            <Select value={f.vehicleReg} onChange={set('vehicleReg')}>
              <option value="">Select vehicle</option>
              {trucks.map((t) => <option key={t.id} value={t.reg}>{t.reg}</option>)}
            </Select>
          </Field>
        </Row>
        <Field label="Material"><TextInput value={f.material} onChange={set('material')} placeholder="Steel coils" /></Field>
        <Row>
          <Field label="Weight (kg)"><TextInput type="number" value={f.weight} onChange={set('weight')} placeholder="6800" /></Field>
          <Field label="Freight (₹)"><TextInput type="number" value={f.freight} onChange={set('freight')} placeholder="5200" /></Field>
        </Row>
      </Modal>
    </PartnerLayout>
  );
}
