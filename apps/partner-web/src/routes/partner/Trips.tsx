import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus, FileText, MapPin, Search, Truck, X, Check, ExternalLink, Flag, Navigation,
  Trash2, Route as RouteIcon,
} from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card } from '../../components/ui/Card.js';
import { KpiCard } from '../../components/ui/KpiCard.js';
import { Table, THead, Th, TBody, Tr, Td } from '../../components/ui/Table.js';
import { Badge, type BadgeTone } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Modal, Field, TextInput, Select, Row } from '../../components/ui/Modal.js';
import { rupees } from '../../lib/format.js';
import { osCounters, type Trip, type TripPoint, type TripStatus } from '../../lib/mocks.js';
import { useStore, todayLabel } from '../../lib/store.js';
import { useNotify } from '../../lib/notify.js';
import { printLR } from '../../lib/print.js';
import { tripSteps, tripPoints, currentStep, progressPct } from '../../lib/trip.js';

const TRIP_BADGE: Record<TripStatus, { label: string; tone: BadgeTone }> = {
  assigned: { label: 'Assigned', tone: 'info' },
  loading: { label: 'Loading', tone: 'accent' },
  in_transit: { label: 'In transit', tone: 'primary' },
  at_drop: { label: 'At drop', tone: 'primary' },
  pod_pending: { label: 'POD pending', tone: 'warning' },
  closed: { label: 'Closed', tone: 'success' },
};

const FILTERS = ['All', 'Scheduled', 'Ongoing', 'Completed'] as const;
type Filter = (typeof FILTERS)[number];

function matchesFilter(status: TripStatus, filter: Filter): boolean {
  if (filter === 'All') return true;
  if (filter === 'Scheduled') return status === 'assigned';
  if (filter === 'Completed') return status === 'closed';
  return status !== 'assigned' && status !== 'closed'; // Ongoing
}

/** A single point row in the new-trip form. */
interface PointDraft { label: string; mapUrl: string }
const blankPoint = (): PointDraft => ({ label: '', mapUrl: '' });
const EMPTY = {
  mode: 'single' as 'single' | 'multi',
  driver: '', vehicleReg: '', customer: '', material: '', weight: '', freight: '',
};

export function Trips() {
  const { trips, drivers, trucks, customers, savedPoints, addTrip, addSavedPoint, advanceTrip } = useStore();
  const { push } = useNotify();
  const [params] = useSearchParams();
  const initialFilter = FILTERS.find((x) => x === params.get('f')) ?? 'All';
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(EMPTY);
  const [pts, setPts] = useState<PointDraft[]>([blankPoint(), blankPoint()]);
  const [trackLr, setTrackLr] = useState<string | null>(null);

  const shown = trips
    .filter((t) => matchesFilter(t.status, filter))
    .filter((t) => (q ? `${t.lr} ${t.vrId ?? ''} ${t.driver} ${t.from} ${t.to} ${t.customer ?? ''}`.toLowerCase().includes(q.toLowerCase()) : true));
  const active = trips.filter((t) => t.status !== 'closed').length;
  const freightTotal = trips.reduce((s, t) => s + t.freightPaise, 0);
  const tracked = trackLr ? trips.find((t) => t.lr === trackLr) ?? null : null;

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  function resetForm() {
    setF(EMPTY); setPts([blankPoint(), blankPoint()]);
  }
  function setMode(mode: 'single' | 'multi') {
    if (mode === 'single' && pts.length > 2) setPts([pts[0]!, pts[pts.length - 1]!]);
    setF({ ...f, mode });
  }
  /** Update a point row; auto-fill a known map link when the name matches a saved point. */
  function setPoint(i: number, patch: Partial<PointDraft>) {
    setPts((prev) => prev.map((p, idx) => {
      if (idx !== i) return p;
      const next = { ...p, ...patch };
      if (patch.label !== undefined && !next.mapUrl) {
        const known = savedPoints.find((sp) => sp.label.toLowerCase() === patch.label!.trim().toLowerCase());
        if (known?.mapUrl) next.mapUrl = known.mapUrl;
      }
      return next;
    }));
  }
  const addStop = () => setPts((prev) => [...prev, blankPoint()]);
  const removeStop = (i: number) => setPts((prev) => prev.filter((_, idx) => idx !== i));

  const activePts = f.mode === 'single' ? pts.slice(0, 2) : pts;
  const valid = activePts[0]?.label.trim() && activePts[activePts.length - 1]?.label.trim()
    && f.driver && f.vehicleReg && Number(f.freight) > 0;

  function pointLabel(i: number, total: number): string {
    if (i === 0) return 'Pickup point';
    if (i === total - 1) return 'Drop point';
    return `Point ${i}`;
  }

  function submit() {
    if (!valid) return;
    const clean = activePts.map((p) => p.label.trim()).filter(Boolean);
    const points: TripPoint[] = activePts
      .filter((p) => p.label.trim())
      .map((p) => (p.mapUrl.trim() ? { label: p.label.trim(), mapUrl: p.mapUrl.trim() } : { label: p.label.trim() }));
    points.forEach((p) => addSavedPoint(p));
    addTrip({
      date: todayLabel(), from: clean[0]!, to: clean[clean.length - 1]!,
      driver: f.driver, vehicleReg: f.vehicleReg,
      material: f.material || 'General goods', weightKg: Number(f.weight) || 0,
      freightPaise: Math.round(Number(f.freight) * 100), status: 'assigned', ewayBill: false,
      points, stepIndex: 0,
      ...(f.customer ? { customer: f.customer } : {}),
    });
    push({ title: 'Trip created', body: `${clean[0]} → ${clean[clean.length - 1]} · ${points.length} points · assigned to ${f.driver}.`, tone: 'success' });
    resetForm(); setOpen(false);
  }

  return (
    <PartnerLayout title="Trips" subtitle="Consignments, lorry receipts & live tracking">
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
              <div className="flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-1.5 ring-1 ring-inset ring-neutral-200">
                <Search size={13} className="text-neutral-400" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search VR / LR / driver / route" className="w-44 bg-transparent text-xs text-neutral-700 outline-none placeholder:text-neutral-400" />
              </div>
              <Button size="sm" onClick={() => { resetForm(); setOpen(true); }}><Plus size={13} /> New trip</Button>
            </div>
          </div>

          <Table>
            <THead>
              <Tr>
                <Th>VR ID / LR</Th><Th>Route</Th><Th>Driver · Vehicle</Th>
                <Th>Live status</Th><Th className="text-right">Freight</Th><Th></Th>
              </Tr>
            </THead>
            <TBody>
              {shown.map((t) => {
                const steps = tripSteps(t);
                const cur = currentStep(t);
                const pct = progressPct(steps, cur);
                const stops = tripPoints(t).length;
                return (
                  <Tr key={t.lr}>
                    <Td>
                      <div className="font-mono text-xs font-extrabold text-primary-700">{t.vrId ?? '—'}</div>
                      <div className="font-mono text-[11px] text-neutral-400">{t.lr} · {t.date}</div>
                    </Td>
                    <Td className="text-neutral-700">
                      <span className="inline-flex items-center gap-1"><MapPin size={11} className="text-emerald-500" />{t.from}</span>
                      <span className="mx-1 text-neutral-300">→</span>
                      <span className="inline-flex items-center gap-1"><MapPin size={11} className="text-rose-500" />{t.to}</span>
                      {stops > 2 && <div className="text-[11px] text-neutral-400">{stops} points · {stops - 2} stop{stops - 2 > 1 ? 's' : ''}</div>}
                    </Td>
                    <Td>
                      <div className="font-semibold text-neutral-800">{t.driver}</div>
                      <div className="font-mono text-[11px] text-neutral-400">{t.vehicleReg}</div>
                    </Td>
                    <Td>
                      <Badge tone={TRIP_BADGE[t.status].tone}>{steps[cur]?.label ?? TRIP_BADGE[t.status].label}</Badge>
                      <div className="mt-1.5 h-1.5 w-28 overflow-hidden rounded-full bg-neutral-100">
                        <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </Td>
                    <Td className="text-right font-bold text-neutral-900">{rupees(t.freightPaise)}</Td>
                    <Td>
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => setTrackLr(t.lr)} className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700" title="Live tracking timeline">
                          <Navigation size={12} /> Track
                        </button>
                        <button onClick={() => printLR(t)} className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-700"><FileText size={12} /> LR</button>
                      </div>
                    </Td>
                  </Tr>
                );
              })}
              {shown.length === 0 && (
                <Tr><Td className="py-8 text-center text-sm text-neutral-400">No trips match.</Td></Tr>
              )}
            </TBody>
          </Table>
        </Card>
      </div>

      {/* Shared datalist powers pickup/drop autocomplete from remembered points */}
      <datalist id="saved-points">
        {savedPoints.map((sp) => <option key={sp.label} value={sp.label} />)}
      </datalist>

      {/* New trip */}
      <Modal open={open} onClose={() => setOpen(false)} title="New trip" subtitle="A VR ID is generated automatically" onSubmit={submit} submitLabel="Create trip" submitDisabled={!valid} wide>
        <div className="rounded-xl bg-primary-50 px-4 py-3 text-sm text-primary-900 ring-1 ring-inset ring-primary-100">
          <span className="font-bold">VR ID</span> is auto-assigned on save · <span className="font-bold">LR</span> number is generated too. Add Google Maps links so the driver can tap to navigate.
        </div>

        {/* single vs multi */}
        <Field label="Trip type">
          <div className="grid grid-cols-2 gap-2">
            {(['single', 'multi'] as const).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold ring-1 ring-inset transition ${f.mode === m ? 'bg-primary-500 text-white ring-primary-500' : 'bg-white text-neutral-600 ring-neutral-200 hover:bg-neutral-50'}`}>
                {m === 'single' ? <><MapPin size={14} /> Single point (pickup → drop)</> : <><RouteIcon size={14} /> Multiple points</>}
              </button>
            ))}
          </div>
        </Field>

        {/* point rows */}
        <div className="space-y-3">
          {activePts.map((p, i) => (
            <div key={i} className="rounded-xl bg-neutral-50 p-3 ring-1 ring-inset ring-neutral-200">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-700">
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black text-white ${i === 0 ? 'bg-emerald-500' : i === activePts.length - 1 ? 'bg-rose-500' : 'bg-primary-500'}`}>{i + 1}</span>
                  {pointLabel(i, activePts.length)}
                </span>
                {f.mode === 'multi' && activePts.length > 2 && (
                  <button type="button" onClick={() => removeStop(i)} className="text-neutral-400 hover:text-rose-500" title="Remove this point"><Trash2 size={14} /></button>
                )}
              </div>
              <TextInput list="saved-points" value={p.label} onChange={(e) => setPoint(i, { label: e.target.value })}
                placeholder={i === 0 ? 'e.g. JP Nagar (type to see saved points)' : 'Location name'} />
              <div className="mt-2 flex items-center gap-2">
                <MapPin size={13} className="shrink-0 text-neutral-400" />
                <TextInput value={p.mapUrl} onChange={(e) => setPoint(i, { mapUrl: e.target.value })} placeholder="Paste Google Maps link (optional)" className="text-xs" />
              </div>
            </div>
          ))}
          {f.mode === 'multi' && (
            <button type="button" onClick={addStop} className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-neutral-300 py-2 text-xs font-bold text-neutral-500 hover:border-primary-300 hover:text-primary-600">
              <Plus size={14} /> Add another point
            </button>
          )}
        </div>

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
        <Field label="Customer" hint="Optional — who this consignment is for">
          <Select value={f.customer} onChange={set('customer')}>
            <option value="">Select customer</option>
            {customers.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Material"><TextInput value={f.material} onChange={set('material')} placeholder="Steel coils" /></Field>
        <Row>
          <Field label="Weight (kg)"><TextInput type="number" value={f.weight} onChange={set('weight')} placeholder="6800" /></Field>
          <Field label="Freight (₹)"><TextInput type="number" value={f.freight} onChange={set('freight')} placeholder="5200" /></Field>
        </Row>
      </Modal>

      {tracked && <TrackModal trip={tracked} onClose={() => setTrackLr(null)} onAdvance={advanceTrip} />}
    </PartnerLayout>
  );
}

/* ─── Live tracking timeline ─────────────────────────────────────────────── */

function TrackModal({ trip, onClose, onAdvance }: {
  trip: Trip; onClose: () => void; onAdvance: (lr: string, remark?: string) => void;
}) {
  const steps = tripSteps(trip);
  const cur = currentStep(trip);
  const pts = tripPoints(trip);
  const pct = progressPct(steps, cur);
  const finished = cur >= steps.length - 1;
  const nextIsFinish = cur === steps.length - 2;
  const [remark, setRemark] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="animate-scale-in flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-lift ring-1 ring-neutral-200 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        {/* header */}
        <div className="flex items-start justify-between border-b border-neutral-100 bg-primary-600 px-5 py-4 text-white">
          <div>
            <div className="flex items-center gap-2">
              <Truck size={18} />
              <h3 className="font-mono text-base font-extrabold">{trip.vrId ?? trip.lr}</h3>
            </div>
            <p className="mt-0.5 text-xs text-primary-100">{trip.driver} · {trip.vehicleReg}{trip.customer ? ` · ${trip.customer}` : ''}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-primary-100 hover:bg-white/10 hover:text-white"><X size={18} /></button>
        </div>

        {/* moving-truck progress bar */}
        <div className="px-5 pt-5">
          <div className="relative h-2 rounded-full bg-neutral-100">
            <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${pct}%` }} />
            <div className="absolute -top-2.5 -translate-x-1/2 text-lg transition-all duration-500" style={{ left: `${pct}%` }}>
              <span className={finished ? '' : 'inline-block animate-bounce'}>{finished ? '🏁' : '🚚'}</span>
            </div>
          </div>
          <div className="mt-1 flex justify-between text-[11px] font-bold text-neutral-400">
            <span>{trip.from}</span><span>{pct}%</span><span>{trip.to}</span>
          </div>
        </div>

        {/* vertical timeline */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <ol className="relative">
            {steps.map((s, i) => {
              const done = i < cur;
              const now = i === cur;
              const point = s.pointIndex != null ? pts[s.pointIndex] : undefined;
              return (
                <li key={s.key} className="relative flex gap-3 pb-5 last:pb-0">
                  {i < steps.length - 1 && (
                    <span className={`absolute left-[13px] top-6 h-full w-0.5 ${done ? 'bg-emerald-400' : 'bg-neutral-200'}`} />
                  )}
                  <span className={`z-10 flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded-full ring-4 ring-white ${done ? 'bg-emerald-500 text-white' : now ? 'bg-primary-500 text-white' : 'bg-neutral-200 text-neutral-400'}`}>
                    {done ? <Check size={15} />
                      : s.key === 'finished' ? <Flag size={14} />
                        : now ? <span className="text-sm leading-none">🚚</span>
                          : <span className="text-[11px] font-black">{i}</span>}
                  </span>
                  <div className={`pt-0.5 ${now ? '' : done ? 'opacity-90' : 'opacity-55'}`}>
                    <div className="flex items-center gap-2 text-sm font-bold text-neutral-900">
                      {s.label}
                      {now && !finished && <Badge tone="primary">Now</Badge>}
                    </div>
                    {s.place && <div className="text-xs text-neutral-500">{s.place}</div>}
                    {point?.mapUrl && (
                      <a href={point.mapUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-primary-600 hover:text-primary-700">
                        <ExternalLink size={11} /> Open in Google Maps
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          {finished && trip.remark && (
            <div className="mt-1 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-inset ring-amber-100">
              <span className="font-bold">End remark:</span> {trip.remark}
            </div>
          )}
        </div>

        {/* action */}
        {!finished && (
          <div className="border-t border-neutral-100 px-5 py-4">
            {nextIsFinish ? (
              <div className="space-y-2.5">
                <Field label="End-of-trip remark" hint="e.g. delivered fine · police checkpost delay · short payment">
                  <TextInput value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Add a remark before finishing…" />
                </Field>
                <Button className="w-full justify-center" onClick={() => { onAdvance(trip.lr, remark.trim() || undefined); onClose(); }}>
                  <Flag size={14} /> Finish trip
                </Button>
              </div>
            ) : (
              <Button className="w-full justify-center" onClick={() => onAdvance(trip.lr)}>
                <Check size={14} /> Mark reached · {steps[cur + 1]?.label}{steps[cur + 1]?.place ? ` (${steps[cur + 1]!.place})` : ''}
              </Button>
            )}
          </div>
        )}
        {finished && (
          <div className="border-t border-neutral-100 px-5 py-4">
            <div className="flex items-center justify-center gap-2 rounded-lg bg-emerald-50 py-2.5 text-sm font-bold text-emerald-700 ring-1 ring-inset ring-emerald-100">
              <Flag size={15} /> Trip completed
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
