import { useEffect, useMemo, useState } from 'react';
import {
  Plus, MapPin, Trash2, FileSpreadsheet, Search, X, Check, Route as RouteIcon,
  UserCog, Navigation, LogIn, LogOut, Flag, AlertTriangle,
} from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card } from '../../components/ui/Card.js';
import { KpiCard } from '../../components/ui/KpiCard.js';
import { Badge, type BadgeTone } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Modal, Field, TextInput, Select, Row } from '../../components/ui/Modal.js';
import { useStore, todayLabel, type Tour, type TourStop } from '../../lib/store.js';
import { useAuth } from '../../lib/auth.js';
import { watchMembers, type Member } from '../../lib/members.js';
import { vridExists } from '../../lib/tours.js';
import { exportTourSheet } from '../../lib/exportTourSheet.js';
import { useNotify } from '../../lib/notify.js';

const statusTone = (s: string): BadgeTone =>
  s === 'COMPLETED' ? 'success' : s === 'CANCELLED' ? 'danger' : s === 'PLANNED' ? 'info' : 'primary';

const OWN_FLEET = 'Sarva Express (own)';

interface StopDraft { name: string; location: string; arrivalAt: string; departureAt: string }
const blankStopDraft = (): StopDraft => ({ name: '', location: '', arrivalAt: '', departureAt: '' });

const EMPTY = {
  date: '', vendor: '', tripType: 'SCHEDULE' as 'SCHEDULE' | 'ADHOC',
  driver: '', driverNumber: '', vehicleId: '',
  tourId: '', advanceAmount: '', paidPending: 'Pending', noLoadLoad: 'Load', handledBy: '',
};

const fmtDT = (v: string) => {
  if (!v) return '';
  const d = new Date(v);
  return isNaN(d.getTime()) ? v : d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
};
const fmtClock = (ms: number) => new Date(ms).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

export function Tours() {
  const { tours, drivers, trucks, attached, addTour, updateTour } = useStore();
  const { member } = useAuth();
  const isAdmin = member?.role === 'owner' || member?.role === 'manager';
  const { push } = useNotify();
  const [members, setMembers] = useState<Member[]>([]);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [trackId, setTrackId] = useState<string | null>(null);

  // Route Assign form
  const [f, setF] = useState(EMPTY);
  const [vrids, setVrids] = useState<string[]>([]);
  const [vridInput, setVridInput] = useState('');
  const [vridError, setVridError] = useState('');
  const [vridBusy, setVridBusy] = useState(false);
  const [stops, setStops] = useState<StopDraft[]>([blankStopDraft()]);

  useEffect(() => { if (isAdmin) return watchMembers((l) => setMembers(l.filter((m) => m.status === 'active'))); }, [isAdmin]);

  /* ── vendor-linked driver & vehicle choices ─────────────────────────── */
  const vendorDrivers = useMemo(() => {
    if (!f.vendor) return drivers;
    if (f.vendor === OWN_FLEET) return drivers.filter((d) => !d.vendor);
    const v = drivers.filter((d) => d.vendor === f.vendor);
    return v.length ? v : drivers; // vendor with no tagged drivers yet — show all
  }, [drivers, f.vendor]);
  const vendorTrucks = useMemo(() => {
    if (!f.vendor) return trucks;
    if (f.vendor === OWN_FLEET) return trucks.filter((t) => !t.vendor);
    const v = trucks.filter((t) => t.vendor === f.vendor);
    return v.length ? v : trucks;
  }, [trucks, f.vendor]);
  const pickedTruck = trucks.find((t) => t.reg === f.vehicleId);
  const vehicleFeet = pickedTruck?.feet ?? '';

  function pickDriver(name: string) {
    const d = drivers.find((x) => x.name === name);
    setF((p) => ({ ...p, driver: name, driverNumber: d?.phone ?? p.driverNumber, vehicleId: d?.vehicleReg && vendorTrucks.some((t) => t.reg === d.vehicleReg) ? d.vehicleReg : p.vehicleId }));
  }

  /* ── VRID add with company-wide duplicate check ─────────────────────── */
  async function addVrid() {
    const v = vridInput.trim().toUpperCase();
    if (!v || vridBusy) return;
    setVridError('');
    if (vrids.includes(v)) { setVridError(`VRID already exists — ${v} is already added to this route.`); return; }
    setVridBusy(true);
    try {
      if (await vridExists(v)) {
        setVridError(`VRID already exists — ${v} is already used on another route.`);
      } else {
        setVrids((p) => [...p, v]);
        setVridInput('');
      }
    } catch { setVridError('Could not verify the VRID — check your connection and try again.'); }
    finally { setVridBusy(false); }
  }
  const removeVrid = (v: string) => setVrids((p) => p.filter((x) => x !== v));

  /* ── Stops ──────────────────────────────────────────────────────────── */
  const setStop = (i: number, k: keyof StopDraft, v: string) =>
    setStops((p) => p.map((s, idx) => (idx === i ? { ...s, [k]: v } : s)));
  const addStop = () => stops.length < 4 && setStops((p) => [...p, blankStopDraft()]);
  const removeStop = (i: number) => setStops((p) => p.filter((_, idx) => idx !== i));

  /* ── Complete-form validation: nothing may be left empty ────────────── */
  const stopsComplete = stops.length > 0 && stops.every((s) => s.name.trim() && s.location.trim() && s.arrivalAt && s.departureAt);
  const valid = !!(f.date && f.vendor && f.driver && f.vehicleId && f.tourId.trim() && vrids.length > 0 && stopsComplete);

  const missing: string[] = [];
  if (!f.date) missing.push('date');
  if (!f.vendor) missing.push('vendor');
  if (!f.driver) missing.push('driver');
  if (!f.vehicleId) missing.push('vehicle');
  if (!f.tourId.trim()) missing.push('trip ID');
  if (vrids.length === 0) missing.push('at least 1 VRID');
  if (!stopsComplete) missing.push('complete every stop');

  function resetForm() {
    setF({ ...EMPTY, date: new Date().toISOString().slice(0, 10), handledBy: member?.uid ?? '' });
    setVrids([]); setVridInput(''); setVridError(''); setStops([blankStopDraft()]);
  }

  function submit() {
    if (!valid) return;
    const tourStops: TourStop[] = stops.map((s) => ({
      name: s.name.trim().toUpperCase(), location: s.location.trim(),
      arrivalAt: s.arrivalAt, departureAt: s.departureAt,
      amzArrival: fmtDT(s.arrivalAt), amzDeparture: fmtDT(s.departureAt),
      kmPhoto: false, arrivalReport: '', invoicePhoto: false, dispatchReport: '', km: '',
    }));
    const handler = isAdmin && f.handledBy ? members.find((m) => m.uid === f.handledBy) ?? null : null;
    const handledBy = handler ? { uid: handler.uid, name: handler.name } : (member ? { uid: member.uid, name: member.name } : undefined);
    addTour({
      date: f.date ? new Date(f.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : todayLabel(),
      tourId: f.tourId.trim(), vrId: vrids[0] ?? '', vrIds: vrids, seTracker: '', toll: '',
      amzEquipmentType: vehicleFeet, seEquipmentType: vehicleFeet,
      amzStatus: 'PLANNED', sarvaStatus: 'PLANNED',
      present: 'PRESENT', scheduleAdhoc: f.tripType, noLoadLoad: f.noLoadLoad,
      advanceAmount: f.advanceAmount, paidPending: f.paidPending,
      driver: f.driver, vehicleId: f.vehicleId, driverNumber: f.driverNumber,
      vendorName: f.vendor === OWN_FLEET ? 'Sarva Express' : f.vendor,
      stops: tourStops, totalManualKm: '', amazonRelyKm: '', gpsKm: '', remarks: '',
    }, handledBy);
    push({ title: 'Route assigned', body: `${f.tourId} · ${vrids.length} VRID${vrids.length > 1 ? 's' : ''} · ${stops.length} stop${stops.length > 1 ? 's' : ''}.`, tone: 'success' });
    resetForm(); setOpen(false);
  }

  /* ── Search: VRID, trip id, vehicle number, vehicle type, vendor ────── */
  const shown = tours.filter((t) => {
    if (!q) return true;
    const hay = `${t.tourId} ${(t.vrIds ?? []).join(' ')} ${t.vrId} ${t.vehicleId} ${t.amzEquipmentType} ${t.vendorName} ${t.driver} ${t.ownerName ?? ''}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  const completed = tours.filter((t) => t.amzStatus === 'COMPLETED').length;
  const scheduled = tours.filter((t) => t.scheduleAdhoc === 'SCHEDULE').length;
  const advTotal = tours.reduce((s, t) => s + (Number(t.advanceAmount) || 0), 0);
  const tracked = trackId ? tours.find((t) => t.id === trackId) ?? null : null;

  return (
    <PartnerLayout title="Amazon Tours" subtitle={isAdmin ? 'All lines — assign routes to your POCs' : 'Your assigned lines'}>
      <div className="space-y-6">
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Routes" value={String(tours.length)} hint="on record" tone="primary" />
          <KpiCard label="Completed" value={String(completed)} hint="closed out" tone="success" />
          <KpiCard label="Scheduled" value={String(scheduled)} hint="vs ad-hoc" tone="primary" />
          <KpiCard label="Advance" value={`₹${advTotal.toLocaleString('en-IN')}`} hint="total" tone="accent" />
        </section>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-5 py-3">
            <div className="flex flex-1 items-center gap-2 rounded-lg bg-neutral-50 px-3 py-1.5 ring-1 ring-inset ring-neutral-200 sm:max-w-md">
              <Search size={13} className="text-neutral-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search VRID / trip ID / vehicle / type / vendor" className="w-full bg-transparent text-xs text-neutral-700 outline-none placeholder:text-neutral-400" />
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => exportTourSheet(tours)}><FileSpreadsheet size={13} /> Export sheet</Button>
              <Button size="sm" onClick={() => { resetForm(); setOpen(true); }}><RouteIcon size={13} /> Route Assign</Button>
            </div>
          </div>

          {/* Route cards */}
          <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-2">
            {shown.map((t) => {
              const st = t.stops.filter((s) => s.name);
              const done = st.filter((s) => s.actualDeparture).length;
              const pct = st.length ? Math.round((done / st.length) * 100) : 0;
              return (
                <div key={t.id} className="rounded-xl bg-white p-4 ring-1 ring-inset ring-neutral-200 transition hover:ring-primary-200">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-extrabold text-primary-700">{t.tourId}</span>
                        <Badge tone={statusTone(t.amzStatus)}>{t.amzStatus}</Badge>
                        <Badge tone={t.scheduleAdhoc === 'ADHOC' ? 'accent' : 'neutral'}>{t.scheduleAdhoc}</Badge>
                      </div>
                      <div className="text-[11px] text-neutral-400">{t.date} · {t.vendorName || '—'}</div>
                    </div>
                    {isAdmin && t.ownerName && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-1 text-[11px] font-bold text-neutral-600" title="POC (handled by)">
                        <UserCog size={11} /> {t.ownerName}
                      </span>
                    )}
                  </div>

                  {/* VRIDs */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(t.vrIds && t.vrIds.length ? t.vrIds : t.vrId ? [t.vrId] : []).map((v) => (
                      <span key={v} className="rounded-md bg-primary-50 px-2 py-0.5 font-mono text-[11px] font-bold text-primary-700 ring-1 ring-inset ring-primary-100">{v}</span>
                    ))}
                  </div>

                  <div className="mt-2 flex items-center gap-1.5 text-sm text-neutral-700">
                    <MapPin size={12} className="text-primary-500" />
                    <span className="font-semibold">{st.map((s) => s.name).join(' → ') || '—'}</span>
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">{t.driver} · <span className="font-mono">{t.vehicleId}</span>{t.amzEquipmentType ? ` · ${t.amzEquipmentType}` : ''}</div>

                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                    <div className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : 'bg-primary-500'}`} style={{ width: `${pct}%` }} />
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-neutral-900">{t.advanceAmount ? `₹${Number(t.advanceAmount).toLocaleString('en-IN')}` : '—'} <span className="text-[11px] font-semibold text-neutral-400">{t.paidPending}</span></span>
                    <button onClick={() => t.id && setTrackId(t.id)} className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-primary-600 ring-1 ring-inset ring-primary-200 hover:bg-primary-50"><Navigation size={12} /> Track / Check-in</button>
                  </div>
                </div>
              );
            })}
            {shown.length === 0 && (
              <div className="col-span-full py-10 text-center text-sm text-neutral-400">
                {tours.length === 0 ? 'No routes yet — press "Route Assign" to create the first one.' : 'No routes match your search.'}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ── Route Assign ──────────────────────────────────────────────── */}
      <Modal open={open} onClose={() => setOpen(false)} title="Route Assign" subtitle="Assign an Amazon line — every field must be filled to create" onSubmit={submit} submitLabel="Create route" submitDisabled={!valid} wide>
        <Row>
          <Field label="Date"><TextInput type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
          <Field label="Trip type">
            <div className="grid grid-cols-2 gap-2">
              {(['SCHEDULE', 'ADHOC'] as const).map((m) => (
                <button key={m} type="button" onClick={() => setF({ ...f, tripType: m })}
                  className={`rounded-lg px-3 py-2 text-xs font-bold ring-1 ring-inset transition ${f.tripType === m ? 'bg-primary-500 text-white ring-primary-500' : 'bg-white text-neutral-600 ring-neutral-200 hover:bg-neutral-50'}`}>
                  {m === 'SCHEDULE' ? 'Schedule' : 'Ad-hoc'}
                </button>
              ))}
            </div>
          </Field>
        </Row>

        <Field label="Vendor name" hint="Selecting the vendor filters the driver & vehicle lists">
          <Select value={f.vendor} onChange={(e) => setF({ ...f, vendor: e.target.value, driver: '', driverNumber: '', vehicleId: '' })}>
            <option value="">Select vendor</option>
            <option value={OWN_FLEET}>{OWN_FLEET}</option>
            {attached.map((a) => <option key={a.id} value={a.owner}>{a.owner}</option>)}
          </Select>
        </Field>

        <Row>
          <Field label="Driver name">
            <Select value={f.driver} onChange={(e) => pickDriver(e.target.value)} disabled={!f.vendor}>
              <option value="">{f.vendor ? 'Select driver' : 'Pick vendor first'}</option>
              {vendorDrivers.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
            </Select>
          </Field>
          <Field label="Vehicle number">
            <Select value={f.vehicleId} onChange={(e) => setF({ ...f, vehicleId: e.target.value })} disabled={!f.vendor}>
              <option value="">{f.vendor ? 'Select vehicle' : 'Pick vendor first'}</option>
              {vendorTrucks.map((t) => <option key={t.id} value={t.reg}>{t.reg}{t.feet ? ` · ${t.feet}` : ''}</option>)}
            </Select>
          </Field>
        </Row>
        <Row>
          <Field label="Driver number"><TextInput value={f.driverNumber} onChange={(e) => setF({ ...f, driverNumber: e.target.value })} placeholder="auto-fills from driver" /></Field>
          <Field label="Vehicle type" hint="Auto from the vehicle's feet">
            <TextInput value={vehicleFeet || (f.vehicleId ? '—' : '')} disabled placeholder="pick a vehicle" />
          </Field>
        </Row>

        <Field label="Trip ID (manual entry)"><TextInput value={f.tourId} onChange={(e) => setF({ ...f, tourId: e.target.value })} placeholder="T-30FPN1321" /></Field>

        {/* VRIDs */}
        <div className="rounded-xl bg-neutral-50 p-3 ring-1 ring-inset ring-neutral-200">
          <div className="mb-2 text-xs font-bold text-neutral-700">VRIDs — each VRID can be used only once</div>
          <div className="flex items-center gap-2">
            <TextInput value={vridInput} onChange={(e) => { setVridInput(e.target.value.toUpperCase()); setVridError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void addVrid(); } }}
              placeholder="112ZJHBB9" className="font-mono" />
            <button type="button" onClick={() => void addVrid()} disabled={!vridInput.trim() || vridBusy}
              className="shrink-0 rounded-lg bg-primary-500 px-3 py-2 text-xs font-bold text-white hover:bg-primary-600 disabled:opacity-50">
              {vridBusy ? 'Checking…' : '+ Add VRID'}
            </button>
          </div>
          {vridError && (
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 ring-1 ring-inset ring-rose-200">
              <AlertTriangle size={13} /> {vridError}
            </div>
          )}
          {vrids.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {vrids.map((v) => (
                <span key={v} className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 font-mono text-[11px] font-bold text-primary-700 ring-1 ring-inset ring-primary-200">
                  {v}
                  <button type="button" onClick={() => removeVrid(v)} className="text-neutral-400 hover:text-rose-500"><X size={11} /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Stops */}
        <div className="rounded-xl bg-neutral-50 p-3 ring-1 ring-inset ring-neutral-200">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-700">Stops ({stops.length}/4)</span>
            {stops.length < 4 && <button type="button" onClick={addStop} className="text-xs font-bold text-primary-600 hover:text-primary-700">+ Add stop</button>}
          </div>
          <div className="space-y-3">
            {stops.map((s, i) => (
              <div key={i} className="rounded-lg bg-white p-2.5 ring-1 ring-inset ring-neutral-200">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-neutral-500">Stop {i + 1}</span>
                  {stops.length > 1 && <button type="button" onClick={() => removeStop(i)} className="text-neutral-400 hover:text-rose-500"><Trash2 size={13} /></button>}
                </div>
                <Row>
                  <Field label="Stop name"><TextInput value={s.name} onChange={(e) => setStop(i, 'name', e.target.value.toUpperCase())} placeholder="HKA3" className="font-mono" /></Field>
                  <Field label="Stop location"><TextInput value={s.location} onChange={(e) => setStop(i, 'location', e.target.value)} placeholder="Hoskote, Bengaluru" /></Field>
                </Row>
                <Row>
                  <Field label="Arrival date & time"><TextInput type="datetime-local" value={s.arrivalAt} onChange={(e) => setStop(i, 'arrivalAt', e.target.value)} /></Field>
                  <Field label="Departure date & time"><TextInput type="datetime-local" value={s.departureAt} onChange={(e) => setStop(i, 'departureAt', e.target.value)} /></Field>
                </Row>
              </div>
            ))}
          </div>
        </div>

        <Row>
          <Field label="Advance amount (₹)"><TextInput type="number" value={f.advanceAmount} onChange={(e) => setF({ ...f, advanceAmount: e.target.value })} placeholder="2500" /></Field>
          <Field label="Paid / Pending">
            <Select value={f.paidPending} onChange={(e) => setF({ ...f, paidPending: e.target.value })}><option>Pending</option><option>Paid</option></Select>
          </Field>
        </Row>

        {isAdmin && (
          <Field label="Assign to POC" hint="Which team member runs this line — they'll see it on their Tours page">
            <Select value={f.handledBy} onChange={(e) => setF({ ...f, handledBy: e.target.value })}>
              {members.length === 0 && <option value={member?.uid ?? ''}>{member?.name ?? 'Me'}</option>}
              {members.map((m) => <option key={m.uid} value={m.uid}>{m.name}{m.uid === member?.uid ? ' (me)' : ''}</option>)}
            </Select>
          </Field>
        )}

        {!valid && (
          <p className="text-[11px] font-semibold text-amber-700">To create, still needed: {missing.join(' · ')}.</p>
        )}
      </Modal>

      {tracked && <TourTrack tour={tracked} onClose={() => setTrackId(null)} onUpdate={updateTour} showOwner={isAdmin} />}
    </PartnerLayout>
  );
}

/* ─── Live check-in / check-out timeline ─────────────────────────────── */

function TourTrack({ tour, onClose, onUpdate, showOwner }: {
  tour: Tour; onClose: () => void; onUpdate: (id: string, patch: Partial<Tour>) => void; showOwner: boolean;
}) {
  const stops = tour.stops.filter((s) => s.name);
  const done = stops.filter((s) => s.actualDeparture).length;
  const pct = stops.length ? Math.round((done / stops.length) * 100) : 0;
  const finished = stops.length > 0 && done === stops.length;

  function stamp(i: number, key: 'actualArrival' | 'actualDeparture') {
    if (!tour.id) return;
    const next = tour.stops.map((s, idx) => (idx === i ? { ...s, [key]: Date.now() } : s));
    const visible = next.filter((s) => s.name);
    const allOut = visible.length > 0 && visible.every((s) => s.actualDeparture);
    const anyIn = visible.some((s) => s.actualArrival);
    const status = allOut ? 'COMPLETED' : anyIn ? 'IN PROGRESS' : 'PLANNED';
    onUpdate(tour.id, { stops: next, amzStatus: status, sarvaStatus: status });
  }

  const late = (s: TourStop) => s.actualArrival && s.arrivalAt && s.actualArrival > new Date(s.arrivalAt).getTime();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="animate-scale-in flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-lift ring-1 ring-neutral-200 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-neutral-100 bg-primary-600 px-5 py-4 text-white">
          <div>
            <h3 className="font-mono text-base font-extrabold">{tour.tourId}</h3>
            <p className="mt-0.5 text-xs text-primary-100">
              {tour.driver} · {tour.vehicleId}{tour.vendorName ? ` · ${tour.vendorName}` : ''}{showOwner && tour.ownerName ? ` · POC ${tour.ownerName}` : ''}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {(tour.vrIds ?? []).map((v) => <span key={v} className="rounded bg-white/15 px-1.5 py-0.5 font-mono text-[10px] font-bold">{v}</span>)}
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-primary-100 hover:bg-white/10 hover:text-white"><X size={18} /></button>
        </div>

        <div className="px-5 pt-5">
          <div className="relative h-2 rounded-full bg-neutral-100">
            <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${pct}%` }} />
            <div className="absolute -top-2.5 -translate-x-1/2 text-lg transition-all duration-500" style={{ left: `${pct}%` }}>
              <span className={finished ? '' : 'inline-block animate-bounce'}>{finished ? '🏁' : '🚚'}</span>
            </div>
          </div>
          <div className="mt-1 flex justify-between text-[11px] font-bold text-neutral-400">
            <span>{stops[0]?.name}</span><span>{pct}%</span><span>{stops[stops.length - 1]?.name}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <ol className="relative">
            {stops.map((s, i) => {
              const inDone = !!s.actualArrival;
              const outDone = !!s.actualDeparture;
              const current = !outDone && (i === 0 || !!stops[i - 1]?.actualDeparture);
              return (
                <li key={i} className="relative flex gap-3 pb-5 last:pb-0">
                  {i < stops.length - 1 && <span className={`absolute left-[13px] top-6 h-full w-0.5 ${outDone ? 'bg-emerald-400' : 'bg-neutral-200'}`} />}
                  <span className={`z-10 flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded-full ring-4 ring-white ${outDone ? 'bg-emerald-500 text-white' : current ? 'bg-primary-500 text-white' : 'bg-neutral-200 text-neutral-400'}`}>
                    {outDone ? <Check size={15} /> : <span className="font-mono text-[11px] font-black">{i + 1}</span>}
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-neutral-900">
                      <span className="font-mono">{s.name}</span>
                      {current && !outDone && <Badge tone="primary">Now</Badge>}
                      {late(s) && <Badge tone="danger"><AlertTriangle size={10} /> Late</Badge>}
                    </div>
                    {s.location && <div className="text-xs text-neutral-500">{s.location}</div>}
                    <div className="mt-1 grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <div className="text-neutral-400">Arrival · plan {s.amzArrival || '—'}</div>
                        {s.actualArrival
                          ? <div className="font-bold text-emerald-700">✓ In at {fmtClock(s.actualArrival)}</div>
                          : current
                            ? <button onClick={() => stamp(i, 'actualArrival')} className="mt-0.5 inline-flex items-center gap-1 rounded-lg bg-primary-500 px-2 py-1 text-[11px] font-bold text-white hover:bg-primary-600"><LogIn size={11} /> Check in</button>
                            : <div className="text-neutral-300">—</div>}
                      </div>
                      <div>
                        <div className="text-neutral-400">Departure · plan {s.amzDeparture || '—'}</div>
                        {s.actualDeparture
                          ? <div className="font-bold text-emerald-700">✓ Out at {fmtClock(s.actualDeparture)}</div>
                          : inDone
                            ? <button onClick={() => stamp(i, 'actualDeparture')} className="mt-0.5 inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-2 py-1 text-[11px] font-bold text-white hover:bg-emerald-600"><LogOut size={11} /> Check out</button>
                            : <div className="text-neutral-300">—</div>}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="border-t border-neutral-100 px-5 py-4">
          {finished
            ? <div className="flex items-center justify-center gap-2 rounded-lg bg-emerald-50 py-2.5 text-sm font-bold text-emerald-700 ring-1 ring-inset ring-emerald-100"><Flag size={15} /> Route completed — all stops checked out</div>
            : <p className="text-center text-[11px] text-neutral-400">Check in when the truck reaches a facility, check out when it leaves. Timestamps are recorded automatically.</p>}
        </div>
      </div>
    </div>
  );
}
