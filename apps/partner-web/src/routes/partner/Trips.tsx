import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Plus, FileText, MapPin, Search, Truck, X, Check, ExternalLink, Flag, Navigation,
  Trash2, Route as RouteIcon, UserPlus, UserCog, ChevronRight, Pencil, Download, CalendarRange,
} from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card } from '../../components/ui/Card.js';
import { KpiCard } from '../../components/ui/KpiCard.js';
import { Badge, type BadgeTone } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Modal, Field, TextInput, DateInput, Select, Row } from '../../components/ui/Modal.js';
import { rupees, todayFullLabel } from '../../lib/format.js';
import {
  nameError, phoneError, aadhaarError, licenceError, vehicleRegError,
  requiredError, positiveError, normalizePhone, allClear,
} from '../../lib/validate.js';
import { isVerified, type Trip, type TripPoint, type TripStatus } from '../../lib/mocks.js';
import { useStore, stageOf, type Customer } from '../../lib/store.js';
import { useAuth } from '../../lib/auth.js';
import { watchMembers, teamOf, type Member } from '../../lib/members.js';
import { canEditRecords } from '../../lib/roles.js';
import { useNotify } from '../../lib/notify.js';
import { printLR } from '../../lib/print.js';
import { exportRows, rupeeCell, type Cell } from '../../lib/exportExcel.js';
import { tripSteps, tripPoints, currentStep, progressPct } from '../../lib/trip.js';

const TRIP_BADGE: Record<TripStatus, { label: string; tone: BadgeTone }> = {
  assigned: { label: 'Assigned', tone: 'info' },
  loading: { label: 'Loading', tone: 'accent' },
  in_transit: { label: 'In transit', tone: 'primary' },
  at_drop: { label: 'At drop', tone: 'primary' },
  pod_pending: { label: 'POD pending', tone: 'warning' },
  closed: { label: 'Closed', tone: 'success' },
};

const FILTERS = ['All', 'Upcoming', 'In Transit', 'Completed'] as const;
type Filter = (typeof FILTERS)[number];

function matchesFilter(status: TripStatus, filter: Filter): boolean {
  if (filter === 'All') return true;
  if (filter === 'Upcoming') return status === 'assigned';       // assigned, not started
  if (filter === 'Completed') return status === 'closed';
  return status !== 'assigned' && status !== 'closed';           // In Transit: loading → POD
}

interface PointDraft { label: string; mapUrl: string }
const blankPoint = (): PointDraft => ({ label: '', mapUrl: '' });
const EMPTY = {
  mode: 'single' as 'single' | 'multi',
  date: '', driver: '', vehicleReg: '', customer: '', material: '', weight: '', freight: '', handledBy: '',
};
const NEW_DRIVER = { name: '', phone: '', vehicleReg: '', aadhaar: '', licenseNo: '' };

export function Trips() {
  const { trips, drivers, trucks, customers, savedPoints, addTrip, addSavedPoint, addDriver, advanceTrip, updateTrip, deleteTrip } = useStore();
  const { member } = useAuth();
  const isAdmin = member?.role === 'owner' || member?.role === 'manager';
  const canAssign = isAdmin || member?.role === 'team_leader';
  const canEdit = canEditRecords(member?.role);
  const { push } = useNotify();
  const [params] = useSearchParams();
  const [members, setMembers] = useState<Member[]>([]);
  const initialFilter = FILTERS.find((x) => x === params.get('f')) ?? 'All';
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(EMPTY);
  const [pts, setPts] = useState<PointDraft[]>([blankPoint(), blankPoint()]);
  const [trackId, setTrackId] = useState<string | null>(null);
  const [tried, setTried] = useState(false);
  // Completed date window (Admin/TL use it to look back over a period).
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  // Editing reuses the create form — one form, one set of validation rules.
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<Trip | null>(null);
  // inline add — drivers only; transporters go through onboarding in Transporters
  const [drvAdd, setDrvAdd] = useState(false);
  const [newDriver, setNewDriver] = useState(NEW_DRIVER);
  const [drvTried, setDrvTried] = useState(false);

  useEffect(() => { if (canAssign) return watchMembers((l) => setMembers(l.filter((m) => m.status === 'active'))); }, [canAssign]);
  // Owner/manager can hand a trip to anyone; a Team Leader only to their POCs (or themselves).
  const assignable = isAdmin ? members : members.filter((m) => m.leaderUid === member?.uid || m.uid === member?.uid);

  // Completed date window — "which trips finished between these dates". Uses the
  // trip's own timestamp, not its display label, which has no year on old rows.
  const inDateWindow = (t: Trip): boolean => {
    if (filter !== 'Completed' || (!from && !to)) return true;
    const ms = t.createdAtMs ?? 0;
    if (!ms) return false;
    if (from && ms < new Date(`${from}T00:00:00`).getTime()) return false;
    if (to && ms > new Date(`${to}T23:59:59`).getTime()) return false;
    return true;
  };

  const shown = trips
    .filter((t) => matchesFilter(t.status, filter))
    .filter(inDateWindow)
    .filter((t) => (q ? `${t.lr} ${t.vrId ?? ''} ${t.driver} ${t.from} ${t.to} ${t.customer ?? ''} ${t.ownerName ?? ''}`.toLowerCase().includes(q.toLowerCase()) : true));

  /** Export exactly what's on screen — the filter, dates and search applied. */
  function exportShown() {
    exportRows(`sarva-trips-${filter.toLowerCase().replace(/\s+/g, '-')}`,
      ['VR ID', 'LR', 'Date', 'From', 'To', 'Driver', 'Vehicle', 'Transporter', 'Material', 'Weight (kg)', 'Freight (₹)', 'Status', 'Handled by'],
      shown.map((t): Cell[] => [
        t.vrId ?? '', t.lr, t.date, t.from, t.to, t.driver, t.vehicleReg,
        t.customer ?? '', t.material, t.weightKg, rupeeCell(t.freightPaise), t.status, t.ownerName ?? '',
      ]));
    push({ title: 'Exported', body: `${shown.length} trip${shown.length === 1 ? '' : 's'} downloaded.`, tone: 'success' });
  }
  const active = trips.filter((t) => t.status !== 'closed').length;
  const freightTotal = trips.reduce((s, t) => s + t.freightPaise, 0);
  // Real month-to-date count — this used to be a hardcoded demo number.
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
  const tripsMtd = trips.filter((t) => (t.createdAtMs ?? 0) >= monthStart).length;
  const tracked = trackId ? trips.find((t) => t.id === trackId) ?? null : null;

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  function resetForm() {
    setF({ ...EMPTY, date: todayFullLabel(), handledBy: member?.uid ?? '' });
    setPts([blankPoint(), blankPoint()]);
    setTried(false); setEditId(null);
    setDrvAdd(false); setNewDriver(NEW_DRIVER); setDrvTried(false);
  }

  /** Load an existing trip back into the create form. */
  function startEdit(t: Trip) {
    const pts0 = t.points?.length ? t.points : [{ label: t.from }, { label: t.to }];
    setF({
      mode: pts0.length > 2 ? 'multi' : 'single',
      date: t.date, driver: t.driver, vehicleReg: t.vehicleReg, customer: t.customer ?? '',
      material: t.material, weight: String(t.weightKg || ''),
      freight: String((t.freightPaise || 0) / 100), handledBy: t.ownerUid ?? member?.uid ?? '',
    });
    setPts(pts0.map((p) => ({ label: p.label, mapUrl: p.mapUrl ?? '' })));
    setTried(false); setDrvAdd(false); setDrvTried(false);
    setEditId(t.id ?? null);
    setOpen(true);
  }

  function doDelete() {
    if (!confirmDel?.id) return;
    deleteTrip(confirmDel.id);
    push({ title: 'Trip deleted', body: `${confirmDel.lr} removed.`, tone: 'info' });
    setConfirmDel(null);
  }
  function setMode(mode: 'single' | 'multi') {
    if (mode === 'single' && pts.length > 2) setPts([pts[0]!, pts[pts.length - 1]!]);
    setF({ ...f, mode });
  }
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

  // Every field is mandatory before a trip can be saved. Errors only surface
  // once the user has tried to save, so the form doesn't open covered in red.
  // A truck may only go on a trip once an owner/manager has verified its papers.
  // Trucks added before the gate existed are grandfathered (see isVerified).
  const pickedTruck = trucks.find((t) => t.reg === f.vehicleReg);
  const vehicleNotVerified = !!f.vehicleReg && !!pickedTruck && !isVerified(pickedTruck);
  const unverifiedTrucks = trucks.filter((t) => !isVerified(t)).length;
  // ...and a transporter only once their agreement is approved (onboarded).
  const custNotOnboarded = !!f.customer && stageOf(customers.find((c) => c.name === f.customer) ?? ({} as Customer)) !== 'active';
  const pendingCustomers = customers.filter((c) => stageOf(c) !== 'active').length;
  const errs = {
    date: requiredError(f.date, 'Trip date'),
    driver: requiredError(f.driver, 'Driver'),
    vehicleReg: requiredError(f.vehicleReg, 'Vehicle')
      || (vehicleNotVerified ? "This truck's documents aren't verified yet" : ''),
    customer: requiredError(f.customer, 'Transporter')
      || (custNotOnboarded ? "This transporter isn't onboarded yet" : ''),
    material: requiredError(f.material, 'Material'),
    weight: positiveError(f.weight, 'Weight'),
    freight: positiveError(f.freight, 'Freight'),
  };
  const pointsOk = activePts.every((p) => p.label.trim());
  const valid = allClear(errs) && pointsOk;

  function pointLabel(i: number, total: number): string {
    if (i === 0) return 'Pickup point';
    if (i === total - 1) return 'Drop point';
    return `Point ${i}`;
  }

  // Inline "new driver" — the client requires Aadhaar + driving licence up front.
  const drvErrs = {
    name: nameError(newDriver.name, { label: 'Driver name' }),
    phone: phoneError(newDriver.phone),
    aadhaar: aadhaarError(newDriver.aadhaar),
    licenseNo: licenceError(newDriver.licenseNo),
    vehicleReg: vehicleRegError(newDriver.vehicleReg, { required: false }),
  };
  function saveNewDriver() {
    setDrvTried(true);
    if (!allClear(drvErrs)) return;
    const name = newDriver.name.trim();
    addDriver({
      name, phone: normalizePhone(newDriver.phone), vehicleReg: newDriver.vehicleReg.trim().toUpperCase(),
      vehicleType: 'truck', dutyStatus: 'online', kycStatus: 'pending', ratingAvg: 0, tripsToday: 0,
      aadhaar: newDriver.aadhaar.trim(), licenseNo: newDriver.licenseNo.trim().toUpperCase(),
    });
    setF({ ...f, driver: name });
    setDrvAdd(false); setNewDriver(NEW_DRIVER); setDrvTried(false);
    push({ title: 'Driver added', body: `${name} added and selected.`, tone: 'success' });
  }

  function submit() {
    setTried(true);
    if (!valid) return;
    const clean = activePts.map((p) => p.label.trim()).filter(Boolean);
    const points: TripPoint[] = activePts
      .filter((p) => p.label.trim())
      .map((p) => (p.mapUrl.trim() ? { label: p.label.trim(), mapUrl: p.mapUrl.trim() } : { label: p.label.trim() }));
    points.forEach((p) => addSavedPoint(p));
    const handler = canAssign && f.handledBy
      ? members.find((m) => m.uid === f.handledBy) ?? null
      : null;
    const handledBy = handler
      ? { uid: handler.uid, name: handler.name, leaderUid: teamOf(handler) }
      : (member ? { uid: member.uid, name: member.name, leaderUid: teamOf(member) } : undefined);
    const core = {
      date: f.date, from: clean[0]!, to: clean[clean.length - 1]!,
      driver: f.driver, vehicleReg: f.vehicleReg,
      material: f.material.trim(), weightKg: Number(f.weight),
      freightPaise: Math.round(Number(f.freight) * 100),
      points, customer: f.customer,
    };

    if (editId) {
      // Editing keeps the trip's live status/progress and its LR — only the
      // details change. Re-assign the handler if leadership picked a new one.
      updateTrip(editId, { ...core, ...(handledBy ? { ownerUid: handledBy.uid, ownerName: handledBy.name, leaderUid: handledBy.leaderUid } : {}) });
      push({ title: 'Trip updated', body: `${clean[0]} → ${clean[clean.length - 1]} saved.`, tone: 'success' });
    } else {
      addTrip({ ...core, status: 'assigned', ewayBill: false, stepIndex: 0 }, handledBy);
      push({ title: 'Trip created', body: `${clean[0]} → ${clean[clean.length - 1]} · assigned to ${f.driver}.`, tone: 'success' });
    }
    resetForm(); setOpen(false);
  }

  function advanceOnCard(t: Trip) {
    const steps = tripSteps(t); const cur = currentStep(t);
    if (cur >= steps.length - 1 || !t.id) return;
    if (cur === steps.length - 2) setTrackId(t.id); // finishing needs a remark
    else advanceTrip(t.id);
  }

  return (
    <PartnerLayout title="Trips" subtitle={isAdmin ? 'All routes across your team' : 'Your consignments & live tracking'}>
      <div className="space-y-6">
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Active trips" value={String(active)} hint="in progress" tone="primary" />
          <KpiCard label="Trips · MTD" value={String(tripsMtd)} hint="this month" tone="accent" />
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
            <div className="flex flex-wrap items-center gap-2">
              {/* Completed is the tab people go back through, so it gets the date
                  window — "which trips finished between these dates". */}
              {filter === 'Completed' && (
                <div className="flex items-center gap-1.5 rounded-lg bg-neutral-50 px-2.5 py-1 ring-1 ring-inset ring-neutral-200">
                  <CalendarRange size={13} className="shrink-0 text-neutral-400" />
                  <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Completed from"
                    className="bg-transparent text-xs text-neutral-700 outline-none" />
                  <span className="text-xs text-neutral-400">→</span>
                  <input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Completed to"
                    className="bg-transparent text-xs text-neutral-700 outline-none" />
                  {(from || to) && (
                    <button onClick={() => { setFrom(''); setTo(''); }} className="rounded p-0.5 text-neutral-400 hover:text-rose-500" title="Clear dates"><X size={12} /></button>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-1.5 ring-1 ring-inset ring-neutral-200">
                <Search size={13} className="text-neutral-400" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search VR / LR / route / driver" className="w-44 bg-transparent text-xs text-neutral-700 outline-none placeholder:text-neutral-400" />
              </div>
              {/* Export is Admin/TL only, per the client. */}
              {canEdit && (
                <Button size="sm" variant="secondary" onClick={exportShown} disabled={shown.length === 0}>
                  <Download size={13} /> Export
                </Button>
              )}
              <Button size="sm" onClick={() => { resetForm(); setOpen(true); }}><Plus size={13} /> New Trip</Button>
            </div>
          </div>

          {/* Card grid */}
          <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-2">
            {shown.map((t) => {
              const steps = tripSteps(t);
              const cur = currentStep(t);
              const pct = progressPct(steps, cur);
              const stops = tripPoints(t).length;
              const finished = cur >= steps.length - 1;
              const next = steps[cur + 1];
              return (
                <div key={t.id ?? t.lr} className="rounded-xl bg-white p-4 ring-1 ring-inset ring-neutral-200 transition hover:ring-primary-200">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-extrabold text-primary-700">{t.vrId ?? '—'}</span>
                        <Badge tone={TRIP_BADGE[t.status].tone}>{steps[cur]?.label ?? TRIP_BADGE[t.status].label}</Badge>
                      </div>
                      <div className="font-mono text-[11px] text-neutral-400">{t.lr} · {t.date}</div>
                    </div>
                    {isAdmin && t.ownerName && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-1 text-[11px] font-bold text-neutral-600" title="Handled by">
                        <UserCog size={11} /> {t.ownerName}
                      </span>
                    )}
                  </div>

                  <div className="mt-2.5 flex items-center gap-1.5 text-sm text-neutral-700">
                    <MapPin size={12} className="text-emerald-500" /><span className="font-semibold">{t.from}</span>
                    <ChevronRight size={13} className="text-neutral-300" />
                    <MapPin size={12} className="text-rose-500" /><span className="font-semibold">{t.to}</span>
                    {stops > 2 && <span className="text-[11px] text-neutral-400">· {stops - 2} stop{stops - 2 > 1 ? 's' : ''}</span>}
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">{t.driver} · <span className="font-mono">{t.vehicleReg}</span>{t.customer ? ` · ${t.customer}` : ''}</div>

                  {/* progress */}
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                    <div className={`h-full rounded-full transition-all ${finished ? 'bg-emerald-500' : 'bg-primary-500'}`} style={{ width: `${pct}%` }} />
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-sm font-extrabold text-neutral-900">{rupees(t.freightPaise)}</span>
                    <div className="flex items-center gap-2">
                      {!finished && next && (
                        <button onClick={() => advanceOnCard(t)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-600" title="Update status">
                          <Check size={12} /> {cur === steps.length - 2 ? 'Finish' : next.label}
                        </button>
                      )}
                      <button onClick={() => t.id && setTrackId(t.id)} className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-primary-600 ring-1 ring-inset ring-primary-200 hover:bg-primary-50"><Navigation size={12} /> Track</button>
                      <button onClick={() => printLR(t)} className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-neutral-600 ring-1 ring-inset ring-neutral-200 hover:bg-neutral-50"><FileText size={12} /> LR</button>
                      {canEdit && (
                        <>
                          <button onClick={() => startEdit(t)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-primary-600" title="Edit trip"><Pencil size={14} /></button>
                          <button onClick={() => setConfirmDel(t)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-rose-50 hover:text-rose-600" title="Delete trip"><Trash2 size={14} /></button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {shown.length === 0 && (
              <div className="col-span-full py-10 text-center text-sm text-neutral-400">
                {trips.length === 0 ? 'No trips yet — create your first one.' : 'No trips match this filter.'}
              </div>
            )}
          </div>
        </Card>
      </div>

      <datalist id="saved-points">
        {savedPoints.map((sp) => <option key={sp.label} value={sp.label} />)}
      </datalist>

      {/* New trip */}
      <Modal open={open} onClose={() => setOpen(false)}
        title={editId ? 'Edit trip' : 'New Trip'}
        subtitle={editId ? 'The LR, VR ID and live status are kept' : 'A VR ID is generated automatically'}
        onSubmit={submit} submitLabel={editId ? 'Save changes' : 'Create trip'} wide>
        {!editId && (
          <div className="rounded-xl bg-primary-50 px-4 py-3 text-sm text-primary-900 ring-1 ring-inset ring-primary-100">
            <span className="font-bold">VR ID</span> &amp; <span className="font-bold">LR</span> are auto-assigned on save. Add Google Maps links so the driver can tap to navigate.
          </div>
        )}
        {tried && !valid && (
          <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-100">
            Every field marked <span className="text-rose-500">*</span> is required — fill the highlighted ones to save.
          </div>
        )}

        <Field label="Trip date" required error={tried ? errs.date : undefined}>
          <DateInput value={f.date} onChange={(v) => setF({ ...f, date: v })} />
        </Field>

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

        <div className="space-y-3">
          {activePts.map((p, i) => (
            <div key={i} className="rounded-xl bg-neutral-50 p-3 ring-1 ring-inset ring-neutral-200">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-700">
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black text-white ${i === 0 ? 'bg-emerald-500' : i === activePts.length - 1 ? 'bg-rose-500' : 'bg-primary-500'}`}>{i + 1}</span>
                  {pointLabel(i, activePts.length)}<span className="text-rose-500" aria-hidden="true">*</span>
                </span>
                {f.mode === 'multi' && activePts.length > 2 && (
                  <button type="button" onClick={() => removeStop(i)} className="text-neutral-400 hover:text-rose-500" title="Remove this point"><Trash2 size={14} /></button>
                )}
              </div>
              <TextInput list="saved-points" value={p.label} onChange={(e) => setPoint(i, { label: e.target.value })}
                placeholder={i === 0 ? 'e.g. JP Nagar (type to see saved points)' : 'Location name'}
                className={tried && !p.label.trim() ? 'ring-2 ring-rose-300' : ''} />
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

        {/* Driver + inline add */}
        <Field label="Driver" required error={tried ? errs.driver : undefined}>
          <div className="flex items-center gap-2">
            <Select value={f.driver} onChange={set('driver')}>
              <option value="">Select driver</option>
              {drivers.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
            </Select>
            <button type="button" onClick={() => setDrvAdd((v) => !v)} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-white px-2.5 py-2 text-xs font-bold text-primary-600 ring-1 ring-inset ring-primary-200 hover:bg-primary-50"><UserPlus size={13} /> New</button>
          </div>
        </Field>
        {drvAdd && (
          <div className="space-y-3 rounded-xl bg-primary-50/60 p-3 ring-1 ring-inset ring-primary-100">
            <p className="text-[11px] font-bold text-primary-800">New driver — Aadhaar &amp; driving licence are required.</p>
            <Row>
              <Field label="Driver name" required error={drvTried ? drvErrs.name : undefined}>
                <TextInput value={newDriver.name} onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })} placeholder="Suresh" autoFocus />
              </Field>
              <Field label="Phone" required error={drvTried ? drvErrs.phone : undefined}>
                <TextInput inputMode="numeric" maxLength={10} value={newDriver.phone} onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })} placeholder="9876543210" />
              </Field>
            </Row>
            <Row>
              <Field label="Aadhaar" required error={drvTried ? drvErrs.aadhaar : undefined}>
                <TextInput inputMode="numeric" value={newDriver.aadhaar} onChange={(e) => setNewDriver({ ...newDriver, aadhaar: e.target.value })} placeholder="4821 7745 9012" />
              </Field>
              <Field label="Driving licence" required error={drvTried ? drvErrs.licenseNo : undefined}>
                <TextInput value={newDriver.licenseNo} onChange={(e) => setNewDriver({ ...newDriver, licenseNo: e.target.value.toUpperCase() })} placeholder="KA0120200012345" />
              </Field>
            </Row>
            <div className="flex items-end gap-2">
              <Field label="Vehicle number" hint="Optional" error={drvTried ? drvErrs.vehicleReg : undefined}>
                <TextInput value={newDriver.vehicleReg} onChange={(e) => setNewDriver({ ...newDriver, vehicleReg: e.target.value.toUpperCase() })} placeholder="KA01AB1234" />
              </Field>
              <button type="button" onClick={saveNewDriver} className="mb-0.5 shrink-0 rounded-lg bg-primary-500 px-3 py-2 text-xs font-bold text-white hover:bg-primary-600">Add driver</button>
            </div>
          </div>
        )}

        <Field label="Vehicle" required error={tried ? errs.vehicleReg : undefined}
          hint={unverifiedTrucks > 0 ? `${unverifiedTrucks} truck${unverifiedTrucks === 1 ? '' : 's'} can't be picked until their documents are verified in Trucks & Drivers.` : undefined}>
          <Select value={f.vehicleReg} onChange={set('vehicleReg')}>
            <option value="">Select vehicle</option>
            {trucks.map((t) => (
              <option key={t.id} value={t.reg} disabled={!isVerified(t)}>
                {t.reg}{isVerified(t) ? '' : ' — documents not verified'}
              </option>
            ))}
          </Select>
        </Field>

        {/* Transporter + inline add */}
        <Field label="Transporter" required error={tried ? errs.customer : undefined}
          hint={pendingCustomers > 0 ? `${pendingCustomers} transporter${pendingCustomers === 1 ? '' : 's'} can't be picked until their agreement is approved.` : undefined}>
          <div className="flex items-center gap-2">
            <Select value={f.customer} onChange={set('customer')}>
              <option value="">Select transporter</option>
              {customers.map((c) => (
                <option key={c.id} value={c.name} disabled={stageOf(c) !== 'active'}>
                  {c.name}{stageOf(c) === 'active' ? '' : ' — not onboarded'}
                </option>
              ))}
            </Select>
            {/* No inline "add transporter" here any more: onboarding is a real
                process (full legal/bank details, a 7-day letter, then an approved
                agreement), and a vendor created here would be a draft — unusable
                on the very trip being created. Send them to Transporters instead. */}
            <Link to="/p/customers" className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-white px-2.5 py-2 text-xs font-bold text-primary-600 ring-1 ring-inset ring-primary-200 hover:bg-primary-50" title="Onboard a new transporter">
              <UserPlus size={13} /> Onboard
            </Link>
          </div>
        </Field>

        {canAssign && (
          <Field label="Handled by" hint={isAdmin ? 'Which team member owns this route' : 'Which of your POCs runs this route'}>
            <Select value={f.handledBy} onChange={set('handledBy')}>
              {assignable.length === 0 && <option value={member?.uid ?? ''}>{member?.name ?? 'Me'}</option>}
              {assignable.map((m) => <option key={m.uid} value={m.uid}>{m.name}{m.uid === member?.uid ? ' (me)' : ''}</option>)}
            </Select>
          </Field>
        )}

        <Field label="Material" required error={tried ? errs.material : undefined}>
          <TextInput value={f.material} onChange={set('material')} placeholder="Steel coils" />
        </Field>
        <Row>
          <Field label="Weight (kg)" required error={tried ? errs.weight : undefined}>
            <TextInput type="number" value={f.weight} onChange={set('weight')} placeholder="6800" />
          </Field>
          <Field label="Freight (₹)" required error={tried ? errs.freight : undefined}>
            <TextInput type="number" value={f.freight} onChange={set('freight')} placeholder="5200" />
          </Field>
        </Row>
      </Modal>

      {tracked && <TrackModal trip={tracked} onClose={() => setTrackId(null)} onAdvance={advanceTrip} showOwner={isAdmin} />}

      {/* Delete trip */}
      {confirmDel && (
        <Modal open onClose={() => setConfirmDel(null)} title={`Delete ${confirmDel.lr}?`} subtitle="This removes the trip for everyone"
          onSubmit={doDelete} submitLabel="Delete trip">
          <p className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-800 ring-1 ring-inset ring-rose-100">
            <b>{confirmDel.lr}</b> ({confirmDel.from} → {confirmDel.to}, {confirmDel.driver}) will be removed for the whole team.
            {confirmDel.status !== 'closed' && <> This trip is still <b>in progress</b>.</>} Any invoice already raised against it stays. This can't be undone.
          </p>
        </Modal>
      )}
    </PartnerLayout>
  );
}

/* ─── Live tracking timeline ─────────────────────────────────────────────── */

function TrackModal({ trip, onClose, onAdvance, showOwner }: {
  trip: Trip; onClose: () => void; onAdvance: (id: string, remark?: string) => void; showOwner: boolean;
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
        <div className="flex items-start justify-between border-b border-neutral-100 bg-primary-600 px-5 py-4 text-white">
          <div>
            <div className="flex items-center gap-2">
              <Truck size={18} />
              <h3 className="font-mono text-base font-extrabold">{trip.vrId ?? trip.lr}</h3>
            </div>
            <p className="mt-0.5 text-xs text-primary-100">{trip.driver} · {trip.vehicleReg}{trip.customer ? ` · ${trip.customer}` : ''}{showOwner && trip.ownerName ? ` · handled by ${trip.ownerName}` : ''}</p>
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
            <span>{trip.from}</span><span>{pct}%</span><span>{trip.to}</span>
          </div>
        </div>

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

        {!finished && trip.id && (
          <div className="border-t border-neutral-100 px-5 py-4">
            {nextIsFinish ? (
              <div className="space-y-2.5">
                <Field label="End-of-trip remark" hint="e.g. delivered fine · police checkpost delay · short payment">
                  <TextInput value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Add a remark before finishing…" />
                </Field>
                <Button className="w-full justify-center" onClick={() => { onAdvance(trip.id!, remark.trim() || undefined); onClose(); }}>
                  <Flag size={14} /> Finish trip
                </Button>
              </div>
            ) : (
              <Button className="w-full justify-center" onClick={() => onAdvance(trip.id!)}>
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
