import { useEffect, useMemo, useState } from 'react';
import {
  MapPin, Trash2, FileSpreadsheet, Search, X, Check, Route as RouteIcon, UserCog,
  Navigation, LogIn, LogOut, Flag, AlertTriangle, Truck, Package, Plus, Send, Save, Pencil, Fuel, Copy,
} from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Modal, Field, TextInput, DateTimeInput, Select, Row } from '../../components/ui/Modal.js';
import { ImageUpload } from '../../components/ui/ImageUpload.js';
import { useStore, todayLabel, type Tour, type TourLeg, type TourLegStop } from '../../lib/store.js';
import { useAuth } from '../../lib/auth.js';
import { watchMembers, teamOf, type Member } from '../../lib/members.js';
import { canEditRecords } from '../../lib/roles.js';
import { vridHolder, updateTourLegs } from '../../lib/tours.js';
import { exportTourSheet } from '../../lib/exportTourSheet.js';
import { vendorMessage, driverMessage, dieselRequestMessage, waLink } from '../../lib/tourMessages.js';
import { requiredError, phoneError, positiveError, normalizePhone, allClear } from '../../lib/validate.js';
import { useNotify } from '../../lib/notify.js';

const INK = '#232F3E';
const ORANGE = '#FF9900';
const OWN_FLEET = 'Sarva Express (own)';
// The client wants just these two on the line board — a route is either on the
// board, or it's one that's already been sent out to the vendor/driver.
const FILTERS = ['All', 'Shared'] as const;
type Filter = (typeof FILTERS)[number];

/** "Shared" = the route has been sent to the vendor and/or the driver. */
const isShared = (t: Tour): boolean => !!t.sharedVendor || !!t.sharedDriver;

function statusPill(s: string) {
  if (s === 'COMPLETED') return { bg: '#E4F5E9', fg: '#067D62', label: 'Completed' };
  if (s === 'IN PROGRESS') return { bg: '#FFF3E0', fg: '#B15C00', label: 'In transit' };
  if (s === 'CANCELLED') return { bg: '#FCE9EC', fg: '#B12704', label: 'Cancelled' };
  return { bg: '#EAF3FB', fg: '#0F5C9E', label: 'Planned' };
}

interface StopDraft { name: string; mapUrl: string; arrivalAt: string; departureAt: string }
interface LegDraft { vrid: string; loadType: string; error: string; stops: StopDraft[] }
const blankStopDraft = (): StopDraft => ({ name: '', mapUrl: '', arrivalAt: '', departureAt: '' });
const blankLeg = (): LegDraft => ({ vrid: '', loadType: 'Load', error: '', stops: [blankStopDraft()] });

const EMPTY = {
  serviceAt: '', vendor: '', tripType: 'SCHEDULE' as 'SCHEDULE' | 'ADHOC',
  driver: '', driverNumber: '', vehicleId: '', tourId: '',
  gpayName: '', gpayNumber: '', advanceAmount: '', paidPending: 'Pending', handledBy: '',
};

/** The VRIDs a route holds — legs first, falling back to the legacy fields. */
const tourVridList = (t: Tour): string[] =>
  (t.legs?.length ? t.legs.map((l) => l.vrid) : t.vrIds?.length ? t.vrIds : t.vrId ? [t.vrId] : []).filter(Boolean);
const tourVridCount = (t: Tour): number => tourVridList(t).length;

const fmtClock = (ms: number) => new Date(ms).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
const fmtDTShort = (v?: string) => {
  if (!v) return '';
  const d = new Date(v);
  return isNaN(d.getTime()) ? v : d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
};

export function Tours() {
  const { tours, drivers, trucks, attached, addTour, updateTour, deleteTour } = useStore();
  const { member } = useAuth();
  const isAdmin = member?.role === 'owner' || member?.role === 'manager';
  const canAssign = isAdmin || member?.role === 'team_leader';
  const { push } = useNotify();
  const [members, setMembers] = useState<Member[]>([]);
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<Filter>('All');
  const [open, setOpen] = useState(false);
  const [operateId, setOperateId] = useState<string | null>(null);

  const [f, setF] = useState(EMPTY);
  const [legs, setLegs] = useState<LegDraft[]>([blankLeg()]);
  const [busy, setBusy] = useState(false);
  // Editing reuses the Route Assign form; delete needs the whole tour so its
  // VRIDs can be released.
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<Tour | null>(null);
  const canEdit = canEditRecords(member?.role);
  // Step 2 of route creation: hand the new line to a POC.
  const [assignFor, setAssignFor] = useState<{ id: string; tourId: string; vrids: number } | null>(null);
  const [assignPoc, setAssignPoc] = useState('');
  // Diesel request (was "Open / Update") — the advance ask for a run.
  const [dieselId, setDieselId] = useState<string | null>(null);
  const diesel = dieselId ? tours.find((t) => t.id === dieselId) ?? null : null;

  useEffect(() => { if (canAssign) return watchMembers((l) => setMembers(l.filter((m) => m.status === 'active'))); }, [canAssign]);
  const assignable = isAdmin ? members : members.filter((m) => m.leaderUid === member?.uid || m.uid === member?.uid);

  // Strictly the vendor's own drivers/vehicles — no falling back to the full
  // list when a vendor has none on file. Showing another vendor's driver as
  // pickable is exactly what the client asked us to stop; an empty list is the
  // honest answer, and the field says so.
  const vendorDrivers = useMemo(() => {
    if (!f.vendor) return [];
    if (f.vendor === OWN_FLEET) return drivers.filter((d) => !d.vendor);
    return drivers.filter((d) => d.vendor === f.vendor);
  }, [drivers, f.vendor]);
  const vendorTrucks = useMemo(() => {
    if (!f.vendor) return [];
    if (f.vendor === OWN_FLEET) return trucks.filter((t) => !t.vendor);
    return trucks.filter((t) => t.vendor === f.vendor);
  }, [trucks, f.vendor]);
  const vehicleFeet = trucks.find((t) => t.reg === f.vehicleId)?.feet ?? '';

  function pickDriver(name: string) {
    const d = drivers.find((x) => x.name === name);
    setF((p) => ({ ...p, driver: name, driverNumber: d?.phone ?? p.driverNumber, vehicleId: d?.vehicleReg && vendorTrucks.some((t) => t.reg === d.vehicleReg) ? d.vehicleReg : p.vehicleId }));
  }

  /* ── VRID legs ─────────────────────────────────────────────────────── */
  const setLeg = (li: number, patch: Partial<LegDraft>) => setLegs((p) => p.map((l, i) => (i === li ? { ...l, ...patch } : l)));
  const addLeg = () => setLegs((p) => [...p, blankLeg()]);
  const removeLeg = (li: number) => setLegs((p) => p.filter((_, i) => i !== li));
  const addLegStop = (li: number) => setLegs((p) => p.map((l, i) => (i === li && l.stops.length < 6 ? { ...l, stops: [...l.stops, blankStopDraft()] } : l)));
  const removeLegStop = (li: number, si: number) => setLegs((p) => p.map((l, i) => (i === li ? { ...l, stops: l.stops.filter((_, j) => j !== si) } : l)));
  const setLegStop = (li: number, si: number, patch: Partial<StopDraft>) =>
    setLegs((p) => p.map((l, i) => (i === li ? { ...l, stops: l.stops.map((s, j) => (j === si ? { ...s, ...patch } : s)) } : l)));

  async function checkVridBlur(li: number) {
    const v = legs[li]?.vrid.trim().toUpperCase();
    if (!v) return;
    if (legs.some((l, i) => i !== li && l.vrid.trim().toUpperCase() === v)) { setLeg(li, { error: `VRID already exists — ${v} is on another leg above.` }); return; }
    try {
      // A VRID held by the route being edited isn't a duplicate — it's its own.
      const holder = await vridHolder(v);
      setLeg(li, { error: holder && holder !== editId ? `VRID already exists — ${v} is used on another route.` : '' });
    } catch { /* ignore, re-checked on submit */ }
  }

  const stopComplete = (s: StopDraft) => s.name.trim() && s.mapUrl.trim() && s.arrivalAt && s.departureAt;
  const legComplete = (l: LegDraft) => l.vrid.trim() && !l.error && l.stops.length > 0 && l.stops.every(stopComplete);
  // G-pay & advance are no longer part of creating a route — they're asked for
  // in the Diesel Request. Requiring them here would make the form unsavable.
  const baseComplete = !!(f.serviceAt && f.vendor && f.driver && f.vehicleId && f.tourId.trim());
  const valid = baseComplete && legs.length > 0 && legs.every(legComplete);

  const missing: string[] = [];
  if (!f.serviceAt) missing.push('service date & time');
  if (!f.vendor) missing.push('vendor');
  if (!f.driver) missing.push('driver');
  if (!f.vehicleId) missing.push('vehicle');
  if (!f.tourId.trim()) missing.push('trip ID');
  if (!legs.every(legComplete)) missing.push('complete every VRID & its stops');

  function resetForm() {
    const now = new Date(); now.setSeconds(0, 0);
    setF({ ...EMPTY, serviceAt: new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16), handledBy: member?.uid ?? '' });
    setLegs([blankLeg()]);
    setEditId(null);
  }

  /** Load an existing route back into the Route Assign form. */
  function startEdit(t: Tour) {
    setF({
      serviceAt: t.serviceAt ?? '', vendor: t.vendorName === 'Sarva Express' ? OWN_FLEET : (t.vendorName ?? ''),
      tripType: (t.scheduleAdhoc === 'ADHOC' ? 'ADHOC' : 'SCHEDULE'),
      driver: t.driver ?? '', driverNumber: t.driverNumber ?? '', vehicleId: t.vehicleId ?? '',
      tourId: t.tourId ?? '', gpayName: t.gpayName ?? '', gpayNumber: t.gpayNumber ?? '',
      advanceAmount: t.advanceAmount ?? '', paidPending: t.paidPending || 'Pending',
      handledBy: t.ownerUid ?? member?.uid ?? '',
    });
    setLegs((t.legs?.length ? t.legs : [{ vrid: t.vrId ?? '', loadType: t.noLoadLoad || 'Load', stops: [] }]).map((l) => ({
      vrid: l.vrid, loadType: l.loadType || 'Load', error: '',
      stops: (l.stops?.length ? l.stops : [{ name: '' }]).map((s) => ({
        name: s.name ?? '', mapUrl: s.mapUrl ?? '', arrivalAt: s.arrivalAt ?? '', departureAt: s.departureAt ?? '',
      })),
    })));
    setEditId(t.id);
    setOpen(true);
  }

  function doDelete() {
    if (!confirmDel) return;
    deleteTour(confirmDel);
    push({
      title: 'Route deleted',
      body: `${confirmDel.tourId || 'Route'} removed — its VRID${tourVridCount(confirmDel) === 1 ? '' : 's'} freed for reuse.`,
      tone: 'info',
    });
    setConfirmDel(null);
  }

  async function submit() {
    if (!valid || busy) return;
    setBusy(true);
    try {
      // Final company-wide VRID uniqueness re-check. When editing, a VRID this
      // route already holds is fine — only a clash with a *different* route is
      // a duplicate, otherwise a route could never be saved without changing it.
      for (let i = 0; i < legs.length; i++) {
        const v = legs[i]!.vrid.trim().toUpperCase();
        if (legs.some((l, j) => j !== i && l.vrid.trim().toUpperCase() === v)) { setLeg(i, { error: `VRID already exists — ${v} is on another leg.` }); setBusy(false); return; }
        const holder = await vridHolder(v);
        if (holder && holder !== editId) { setLeg(i, { error: `VRID already exists — ${v} is used on another route.` }); setBusy(false); return; }
      }
      const tourLegs: TourLeg[] = legs.map((l) => ({
        vrid: l.vrid.trim().toUpperCase(), loadType: l.loadType,
        stops: l.stops.map((s) => ({ name: s.name.trim().toUpperCase(), mapUrl: s.mapUrl.trim(), location: s.mapUrl.trim(), arrivalAt: s.arrivalAt, departureAt: s.departureAt })),
      }));
      const handler = canAssign && f.handledBy ? members.find((m) => m.uid === f.handledBy) ?? null : null;
      const handledBy = handler
        ? { uid: handler.uid, name: handler.name, leaderUid: teamOf(handler) }
        : (member ? { uid: member.uid, name: member.name, leaderUid: teamOf(member) } : undefined);
      const svc = new Date(f.serviceAt);
      const core = {
        date: isNaN(svc.getTime()) ? todayLabel() : svc.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        serviceAt: f.serviceAt,
        tourId: f.tourId.trim(), vrId: tourLegs[0]?.vrid ?? '', vrIds: tourLegs.map((l) => l.vrid), legs: tourLegs,
        amzEquipmentType: vehicleFeet, seEquipmentType: vehicleFeet,
        scheduleAdhoc: f.tripType, noLoadLoad: legs[0]?.loadType ?? 'Load',
        advanceAmount: f.advanceAmount, paidPending: f.paidPending, gpayName: f.gpayName.trim(), gpayNumber: f.gpayNumber.trim(),
        driver: f.driver, vehicleId: f.vehicleId, driverNumber: f.driverNumber, vendorName: f.vendor === OWN_FLEET ? 'Sarva Express' : f.vendor,
      };

      if (editId) {
        const existing = tours.find((t) => t.id === editId);
        if (existing) {
          // Keep the POC's own work — statuses, KM, photos, check-ins — and
          // re-point the VRID registry at this route, freeing any it dropped.
          await updateTourLegs(existing, {
            ...core,
            ...(handledBy ? { ownerUid: handledBy.uid, ownerName: handledBy.name, leaderUid: handledBy.leaderUid } : {}),
          }, member?.uid ?? '');
          push({ title: 'Route updated', body: `${f.tourId} saved.`, tone: 'success' });
        }
      } else {
        const id = await addTour({
          ...core,
          seTracker: '', toll: '',
          amzStatus: 'PLANNED', sarvaStatus: 'PLANNED', present: 'PRESENT',
          stops: [], totalManualKm: '', amazonRelyKm: '', gpsKm: '', remarks: '',
        }, handledBy);
        push({ title: 'Route created', body: `${f.tourId} · ${legs.length} VRID${legs.length > 1 ? 's' : ''}.`, tone: 'success' });
        // Hand it to a POC as the next step rather than burying the choice in
        // the form. Defaults to whoever created it if they skip.
        if (id && canAssign) {
          setAssignPoc(member?.uid ?? '');
          setAssignFor({ id, tourId: f.tourId.trim(), vrids: legs.length });
        }
      }
      resetForm(); setOpen(false);
    } finally { setBusy(false); }
  }

  const shown = tours.filter((t) => {
    if (tab === 'Shared' && !isShared(t)) return false;
    if (!q) return true;
    const hay = `${t.tourId} ${(t.legs ?? []).map((l) => l.vrid).join(' ')} ${(t.vrIds ?? []).join(' ')} ${t.vehicleId} ${t.amzEquipmentType} ${t.vendorName} ${t.driver} ${t.ownerName ?? ''}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  const inTransit = tours.filter((t) => t.amzStatus === 'IN PROGRESS').length;
  const completed = tours.filter((t) => t.amzStatus === 'COMPLETED').length;
  const advTotal = tours.reduce((s, t) => s + (Number(t.advanceAmount) || 0), 0);
  const operating = operateId ? tours.find((t) => t.id === operateId) ?? null : null;

  return (
    <PartnerLayout title="Amazon Tours" subtitle={isAdmin ? 'Relay line board — assign routes to your POCs' : 'Your assigned Relay lines'}>
      <div className="space-y-5">
        {/* Relay board banner */}
        <div className="overflow-hidden rounded-xl shadow-sm" style={{ background: INK }}>
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: ORANGE }}><Truck size={18} color={INK} /></span>
              <div>
                <div className="text-[15px] font-extrabold text-white">Line Board</div>
                <div className="text-[11px] font-medium text-white/60">Amazon relay tours &amp; vehicle runs</div>
              </div>
            </div>
            <div className="flex flex-1 items-center gap-2 sm:flex-none">
              <div className="flex flex-1 items-center gap-2 rounded-lg bg-white/10 px-3 py-2 ring-1 ring-inset ring-white/15 sm:w-72">
                <Search size={14} className="text-white/60" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search VRID / trip ID / vehicle / vendor" className="w-full bg-transparent text-xs text-white outline-none placeholder:text-white/45" />
              </div>
              <button onClick={() => exportTourSheet(tours)} className="hidden items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-white ring-1 ring-inset ring-white/15 hover:bg-white/15 sm:inline-flex"><FileSpreadsheet size={13} /> Export</button>
              <button onClick={() => { resetForm(); setOpen(true); }} className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-extrabold shadow-sm" style={{ background: ORANGE, color: INK }}><RouteIcon size={14} /> Route Assign</button>
            </div>
          </div>
          {/* No money tile here — advance is a diesel-request matter now, not a
              headline figure on the board (client's call). */}
          <div className="grid grid-cols-3 border-t border-white/10">
            {[{ k: 'Total lines', v: String(tours.length) }, { k: 'In transit', v: String(inTransit) }, { k: 'Completed', v: String(completed) }].map((s, i) => (
              <div key={s.k} className={`px-5 py-3 ${i < 2 ? 'border-r border-white/10' : ''}`}>
                <div className="text-lg font-extrabold text-white tabular-nums">{s.v}</div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-white/50">{s.k}</div>
              </div>
            ))}
          </div>
        </div>

        {/* tabs */}
        <div className="flex items-center gap-1 overflow-x-auto border-b" style={{ borderColor: '#D5D9D9' }}>
          {FILTERS.map((x) => {
            const on = tab === x;
            return (
              <button key={x} onClick={() => setTab(x)} className="relative whitespace-nowrap px-4 py-2.5 text-[13px] font-bold transition" style={{ color: on ? INK : '#5A6572' }}>
                {x}{on && <span className="absolute inset-x-2 -bottom-px h-[3px] rounded-t" style={{ background: ORANGE }} />}
              </button>
            );
          })}
        </div>

        {/* load cards */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {shown.map((t) => (
            <TourCard key={t.id} t={t} isAdmin={isAdmin} canEdit={canEdit}
              onOperate={() => t.id && setOperateId(t.id)}
              onDiesel={() => t.id && setDieselId(t.id)}
              onEdit={() => startEdit(t)} onDelete={() => setConfirmDel(t)} onShare={updateTour} />
          ))}
          {shown.length === 0 && (
            <div className="col-span-full rounded-xl bg-white py-12 text-center text-sm text-neutral-400" style={{ border: '1px dashed #D5D9D9' }}>
              {tours.length === 0 ? 'No lines yet — press "Route Assign" to add your first Amazon tour.' : 'No lines match this view.'}
            </div>
          )}
        </div>
      </div>

      {/* ── Route Assign ──────────────────────────────────────────────── */}
      <Modal open={open} onClose={() => setOpen(false)} title="Route Assign" subtitle="Assign an Amazon line — every field must be filled to create" onSubmit={submit} submitLabel={busy ? 'Checking VRIDs…' : 'Create route'} submitDisabled={!valid || busy} wide>
        <Row>
          <Field label="Service date & time"><DateTimeInput value={f.serviceAt} onChange={(v) => setF({ ...f, serviceAt: v })} /></Field>
          <Field label="Trip type">
            <div className="grid grid-cols-2 gap-2">
              {(['SCHEDULE', 'ADHOC'] as const).map((m) => (
                <button key={m} type="button" onClick={() => setF({ ...f, tripType: m })} className="rounded-lg px-3 py-2 text-xs font-bold ring-1 ring-inset transition"
                  style={f.tripType === m ? { background: INK, color: '#fff', borderColor: INK } : { background: '#fff', color: '#5A6572', borderColor: '#D5D9D9' }}>
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
          <Field label="Vehicle type" hint="Auto from the vehicle's feet"><TextInput value={vehicleFeet || (f.vehicleId ? '—' : '')} disabled placeholder="pick a vehicle" /></Field>
        </Row>
        <Field label="Trip ID (manual entry)"><TextInput value={f.tourId} onChange={(e) => setF({ ...f, tourId: e.target.value })} placeholder="T-30FPN0493" /></Field>
        {/* G-pay name/number, advance and paid/pending have moved to the Diesel
            Request on the card — assigning a route and asking for the money are
            two different jobs, done at different times by different people. */}

        {/* VRID legs */}
        <div className="space-y-3">
          {legs.map((leg, li) => (
            <div key={li} className="rounded-xl p-3 ring-1 ring-inset" style={{ background: '#F7F8F8', borderColor: '#D5D9D9' }}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-extrabold" style={{ color: INK }}>VRID {li + 1}</span>
                {legs.length > 1 && <button type="button" onClick={() => removeLeg(li)} className="text-neutral-400 hover:text-rose-500"><Trash2 size={14} /></button>}
              </div>
              {/* Load type is decided when the run actually happens, not when the
                  route is planned — it lives in the In-Transit open-and-update. */}
              <Field label="VRID (manual)"><TextInput value={leg.vrid} onChange={(e) => setLeg(li, { vrid: e.target.value.toUpperCase(), error: '' })} onBlur={() => void checkVridBlur(li)} placeholder="114G4M6QY" className="font-mono" /></Field>
              {leg.error && <div className="mb-2 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 ring-1 ring-inset ring-rose-200"><AlertTriangle size={13} /> {leg.error}</div>}
              <div className="space-y-2">
                {leg.stops.map((s, si) => (
                  <div key={si} className="rounded-lg bg-white p-2.5 ring-1 ring-inset ring-neutral-200">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-neutral-500">Stop {si + 1}</span>
                      {leg.stops.length > 1 && <button type="button" onClick={() => removeLegStop(li, si)} className="text-neutral-400 hover:text-rose-500"><Trash2 size={12} /></button>}
                    </div>
                    <Row>
                      <Field label="Stop name"><TextInput value={s.name} onChange={(e) => setLegStop(li, si, { name: e.target.value.toUpperCase() })} placeholder="HKR3" className="font-mono" /></Field>
                      <Field label="Location — Google Maps link"><TextInput value={s.mapUrl} onChange={(e) => setLegStop(li, si, { mapUrl: e.target.value })} placeholder="https://maps.app.goo.gl/…" className="text-xs" /></Field>
                    </Row>
                    <Row>
                      <Field label="Arrival date & time"><DateTimeInput value={s.arrivalAt} onChange={(v) => setLegStop(li, si, { arrivalAt: v })} /></Field>
                      <Field label="Departure date & time"><DateTimeInput value={s.departureAt} onChange={(v) => setLegStop(li, si, { departureAt: v })} /></Field>
                    </Row>
                  </div>
                ))}
                {leg.stops.length < 6 && <button type="button" onClick={() => addLegStop(li)} className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed py-1.5 text-xs font-bold" style={{ borderColor: '#c9cfd6', color: '#007185' }}><Plus size={13} /> Add stop</button>}
              </div>
            </div>
          ))}
          <button type="button" onClick={addLeg} className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-extrabold text-white" style={{ background: INK }}><Plus size={14} /> Add VRID</button>
        </div>

        {/* Assigning the POC is a separate step now — it happens after Create
            route, so building the line and handing it to someone don't get
            muddled into one form (client's call). */}
        {!valid && <p className="text-[11px] font-semibold" style={{ color: '#B15C00' }}>To create, still needed: {missing.join(' · ')}.</p>}
      </Modal>

      {/* ── Step 2: assign the freshly created route to a POC ─────────────── */}
      {assignFor && canAssign && (
        <Modal open onClose={() => setAssignFor(null)} title="Assign to POC"
          subtitle={`${assignFor.tourId} created — who runs this line?`}
          onSubmit={() => {
            const m = assignable.find((x) => x.uid === assignPoc);
            if (m) {
              updateTour(assignFor.id, { ownerUid: m.uid, ownerName: m.name, leaderUid: teamOf(m) });
              push({ title: 'Route assigned', body: `${assignFor.tourId} handed to ${m.name}.`, tone: 'success' });
            }
            setAssignFor(null);
          }}
          submitLabel="Assign route">
          <p className="rounded-lg px-3 py-2.5 text-sm" style={{ background: '#EAF3EC', color: '#067D62' }}>
            <b>{assignFor.tourId}</b> created with {assignFor.vrids} VRID{assignFor.vrids === 1 ? '' : 's'}.
          </p>
          <Field label="Assign to POC" hint={isAdmin ? "They'll see this line on their Tours page — nobody else will" : 'Which of your POCs runs this line'}>
            <Select value={assignPoc} onChange={(e) => setAssignPoc(e.target.value)}>
              {assignable.length === 0 && <option value={member?.uid ?? ''}>{member?.name ?? 'Me'}</option>}
              {assignable.map((m) => <option key={m.uid} value={m.uid}>{m.name}{m.uid === member?.uid ? ' (me)' : ''}</option>)}
            </Select>
          </Field>
        </Modal>
      )}

      {operating && <TourOperate tour={operating} onClose={() => setOperateId(null)} onUpdate={updateTour} showOwner={isAdmin} />}

      {/* ── Diesel Request ────────────────────────────────────────────────
          The advance ask for a run. G-pay details live here now rather than on
          Route Assign — the money is settled per-run, not when the line is
          planned. Sends the client's exact message format. */}
      {diesel && (
        <DieselRequest tour={diesel} onClose={() => setDieselId(null)} onSave={updateTour} />
      )}

      {/* Delete route */}
      {confirmDel && (
        <Modal open onClose={() => setConfirmDel(null)} title={`Delete ${confirmDel.tourId || 'this route'}?`}
          subtitle="This removes the route for everyone" onSubmit={doDelete} submitLabel="Delete route">
          <p className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-800 ring-1 ring-inset ring-rose-100">
            <b>{confirmDel.tourId || 'This route'}</b>{confirmDel.driver ? ` (${confirmDel.driver}, ${confirmDel.vehicleId})` : ''} will be removed for the whole team,
            along with any check-ins, KM readings and photos the POC recorded against it. This can't be undone.
          </p>
          <p className="rounded-lg bg-sky-50 px-3 py-2 text-[11px] text-sky-800 ring-1 ring-inset ring-sky-100">
            Its VRID{tourVridCount(confirmDel) === 1 ? '' : 's'} — <b>{tourVridList(confirmDel).join(', ') || '—'}</b> — will be released, so {tourVridCount(confirmDel) === 1 ? 'it' : 'they'} can be entered on a new route.
          </p>
        </Modal>
      )}
    </PartnerLayout>
  );
}

/* ─── Load card ──────────────────────────────────────────────────────── */

/**
 * Diesel Request — replaces the old "Open / Update" as the card's primary
 * action. Captures who's being paid and how much, then sends the client's exact
 * message. Date, Trip, Vehicle and the VR ids all come from the route itself, so
 * the only things to type are the payee and the amount.
 */
function DieselRequest({ tour, onClose, onSave }: {
  tour: Tour; onClose: () => void; onSave: (id: string, patch: Partial<Tour>) => void;
}) {
  const { push } = useNotify();
  const [gpayName, setGpayName] = useState(tour.gpayName ?? '');
  const [gpayNumber, setGpayNumber] = useState(tour.gpayNumber ?? '');
  const [advanceAmount, setAdvanceAmount] = useState(tour.advanceAmount ?? '');
  const [paidPending, setPaidPending] = useState(tour.paidPending || 'Pending');

  const errs = {
    gpayName: requiredError(gpayName, 'Name'),
    gpayNumber: phoneError(gpayNumber, { label: 'G-pay number' }),
    advanceAmount: positiveError(advanceAmount, 'Advance amount'),
  };
  const [tried, setTried] = useState(false);
  const ready = allClear(errs);

  // Preview exactly what will be sent, built from the same builder as the send.
  const preview = dieselRequestMessage({ ...tour, gpayName, gpayNumber, advanceAmount });

  function save(andSend: boolean) {
    setTried(true);
    if (!ready) return;
    const patch = { gpayName: gpayName.trim(), gpayNumber: normalizePhone(gpayNumber), advanceAmount: advanceAmount.trim(), paidPending };
    onSave(tour.id, patch);
    if (andSend) {
      window.open(waLink(gpayNumber, dieselRequestMessage({ ...tour, ...patch })), '_blank');
      push({ title: 'Diesel request sent', body: `₹${advanceAmount} to ${gpayName.trim()}.`, tone: 'success' });
    } else {
      push({ title: 'Diesel request saved', body: `₹${advanceAmount} for ${tour.tourId}.`, tone: 'success' });
    }
    onClose();
  }

  return (
    <Modal open onClose={onClose} title="Diesel Request" subtitle={`${tour.tourId} · ${tour.vehicleId}`}
      onSubmit={() => save(true)} submitLabel="Send on WhatsApp" wide>
      <Row>
        <Field label="Name" required hint="Who the advance is paid to" error={tried ? errs.gpayName : undefined}>
          <TextInput value={gpayName} onChange={(e) => setGpayName(e.target.value)} placeholder="Harish" autoFocus />
        </Field>
        <Field label="G/ PAY NO" required error={tried ? errs.gpayNumber : undefined}>
          <TextInput inputMode="numeric" maxLength={10} value={gpayNumber} onChange={(e) => setGpayNumber(e.target.value)} placeholder="9611264801" />
        </Field>
      </Row>
      <Row>
        <Field label="Advance Amount (₹)" required error={tried ? errs.advanceAmount : undefined}>
          <TextInput type="number" value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} placeholder="5000" />
        </Field>
        <Field label="Paid / Pending">
          <Select value={paidPending} onChange={(e) => setPaidPending(e.target.value)}><option>Pending</option><option>Paid</option></Select>
        </Field>
      </Row>

      <div className="rounded-xl p-3 ring-1 ring-inset" style={{ background: '#F7F8F8', borderColor: '#D5D9D9' }}>
        <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-neutral-500">Message preview</div>
        <pre className="whitespace-pre-wrap break-words font-sans text-xs leading-relaxed text-neutral-800">{preview}</pre>
      </div>
      <div className="flex items-center justify-between rounded-lg px-3 py-2 text-[11px]" style={{ background: '#EAF3EC', color: '#067D62' }}>
        <span>Date, Trip, Vehicle no &amp; VR ids come from the route.</span>
        <button type="button" onClick={() => save(false)} className="font-bold hover:underline">Save without sending</button>
      </div>
    </Modal>
  );
}

function TourCard({ t, isAdmin, canEdit, onOperate, onDiesel, onEdit, onDelete, onShare }: {
  t: Tour; isAdmin: boolean; canEdit: boolean;
  onOperate: () => void; onDiesel: () => void; onEdit: () => void; onDelete: () => void;
  onShare: (id: string, patch: Partial<Tour>) => void;
}) {
  const legs = t.legs && t.legs.length ? t.legs : [];
  const allStops = legs.flatMap((l) => l.stops);
  const done = allStops.filter((s) => s.actualDeparture).length;
  const pct = allStops.length ? Math.round((done / allStops.length) * 100) : 0;
  const pill = statusPill(t.amzStatus);
  const vlist = legs.length ? legs.map((l) => l.vrid) : (t.vrIds ?? (t.vrId ? [t.vrId] : []));

  const [copied, setCopied] = useState(false);

  function share(kind: 'vendor' | 'driver') {
    const text = kind === 'vendor' ? vendorMessage(t) : driverMessage(t);
    const phone = kind === 'vendor' ? (t.gpayNumber ?? '') : (t.driverNumber ?? '');
    window.open(waLink(phone, text), '_blank', 'noopener');
    if (t.id) onShare(t.id, kind === 'vendor' ? { sharedVendor: true } : { sharedDriver: true });
  }

  function copyMsg(text: string) {
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    });
  }

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md" style={{ border: '1px solid #D5D9D9' }}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5" style={{ background: '#F7F8F8', borderBottom: '1px solid #E7E9E9' }}>
        <div className="flex items-center gap-2 text-[13px]">
          <Truck size={15} style={{ color: INK }} />
          <span className="font-bold" style={{ color: INK }}>{t.amzEquipmentType || 'Truck'}</span>
          <span className="text-neutral-300">·</span>
          <span className="font-mono font-bold" style={{ color: INK }}>{t.tourId}</span>
          <span className="rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase" style={{ background: t.scheduleAdhoc === 'ADHOC' ? '#FFF3E0' : '#EDEFF1', color: t.scheduleAdhoc === 'ADHOC' ? '#B15C00' : '#5A6572' }}>{t.scheduleAdhoc}</span>
        </div>
        <span className="rounded-full px-2.5 py-0.5 text-[11px] font-extrabold" style={{ background: pill.bg, color: pill.fg }}>{pill.label}</span>
      </div>

      <div className="p-4">
        {/* per-VRID legs */}
        <div className="space-y-2">
          {legs.map((leg, i) => (
            <div key={i} className="rounded-lg px-2.5 py-2" style={{ background: '#F7F8F8' }}>
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded px-1.5 py-0.5 font-mono text-[11px] font-extrabold" style={{ background: '#EAF1F8', color: '#0F5C9E' }}>{leg.vrid}</span>
                <span className="text-[10px] font-bold uppercase" style={{ color: leg.loadType === 'No Load' ? '#B15C00' : '#5A6572' }}>{leg.loadType || 'Load'}</span>
              </div>
              <div className="flex items-center gap-1 overflow-x-auto text-[12px] font-semibold" style={{ color: INK }}>
                {leg.stops.map((s, j) => (
                  <span key={j} className="inline-flex items-center gap-1 whitespace-nowrap">
                    <span className={`h-2 w-2 rounded-full ${s.actualDeparture ? '' : ''}`} style={{ background: s.actualDeparture ? '#067D62' : s.actualArrival ? ORANGE : '#c3c9cf' }} />
                    <span className="font-mono">{s.name}</span>
                    {j < leg.stops.length - 1 && <span className="text-neutral-300">→</span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {legs.length === 0 && <div className="text-xs text-neutral-400">No VRID legs.</div>}
        </div>

        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full" style={{ background: '#EDEFF1' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct === 100 ? '#067D62' : ORANGE }} />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-neutral-600">
            <span className="font-semibold" style={{ color: INK }}>{t.driver}</span> · <span className="font-mono">{t.vehicleId}</span>
            {isAdmin && t.ownerName && <span className="ml-2 inline-flex items-center gap-1 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold text-neutral-600"><UserCog size={10} /> {t.ownerName}</span>}
            <div className="text-[11px] text-neutral-400">{t.date} · {t.vendorName || '—'} · Adv ₹{Number(t.advanceAmount || 0).toLocaleString('en-IN')} · {t.paidPending}</div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={onDiesel} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-extrabold shadow-sm" style={{ background: ORANGE, color: INK }}><Fuel size={13} /> Diesel Request</button>
            {/* Kept until the POC updation moves to Trips › In Transit — otherwise
                there'd be nowhere to record check-ins, KM and photos meanwhile. */}
            <button onClick={onOperate} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-bold ring-1 ring-inset" style={{ color: INK, borderColor: '#D5D9D9', background: '#fff' }}><Navigation size={12} /> Update</button>
            {canEdit && (
              <>
                <button onClick={onEdit} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-primary-600" title="Edit route"><Pencil size={14} /></button>
                <button onClick={onDelete} className="rounded-lg p-1.5 text-neutral-400 hover:bg-rose-50 hover:text-rose-600" title="Delete route"><Trash2 size={14} /></button>
              </>
            )}
          </div>
        </div>

        {/* WhatsApp shares */}
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-3">
          <span className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">Share</span>
          <button onClick={() => share('vendor')} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white" style={{ background: '#25D366' }}>
            <Send size={12} /> Vendor {t.sharedVendor && <Check size={12} />}
          </button>
          <button onClick={() => share('driver')} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white" style={{ background: '#25D366' }}>
            <Send size={12} /> Driver {t.sharedDriver && <Check size={12} />}
          </button>
          {/* Escape hatch: if a WhatsApp client ever flattens the link's line
              breaks again, this puts the exact laid-out text on the clipboard. */}
          <button onClick={() => copyMsg(driverMessage(t))} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold ring-1 ring-inset" style={{ color: INK, borderColor: '#D5D9D9' }} title="Copy the driver message exactly as laid out">
            {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
          </button>
          {(t.sharedVendor || t.sharedDriver) && (
            <span className="text-[11px] font-bold" style={{ color: '#067D62' }}>
              {t.sharedVendor && t.sharedDriver ? 'Both shared ✓' : t.sharedVendor ? 'Vendor shared ✓' : 'Driver shared ✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── POC operate / check-in view ────────────────────────────────────── */

function TourOperate({ tour, onClose, onUpdate, showOwner }: {
  tour: Tour; onClose: () => void; onUpdate: (id: string, patch: Partial<Tour>) => void; showOwner: boolean;
}) {
  const legs = tour.legs ?? [];
  const allStops = legs.flatMap((l) => l.stops);
  const done = allStops.filter((s) => s.actualDeparture).length;
  const pct = allStops.length ? Math.round((done / allStops.length) * 100) : 0;
  const finished = allStops.length > 0 && done === allStops.length;

  // locally-edited operational fields
  const [present, setPresent] = useState(tour.present || 'PRESENT');
  const [remarks, setRemarks] = useState(tour.remarks || '');
  const [totalKm, setTotalKm] = useState(tour.totalManualKm || '');
  const [amazonKm, setAmazonKm] = useState(tour.amazonRelyKm || '');
  const [gpsKm, setGpsKm] = useState(tour.gpsKm || '');
  const [expenseAmount, setExpenseAmount] = useState(tour.expenseAmount || '');
  const [expenseNote, setExpenseNote] = useState(tour.expenseNote || '');
  const [invoiceGiven, setInvoiceGiven] = useState(!!tour.invoiceGiven);
  const [saved, setSaved] = useState(false);

  function stampStop(li: number, si: number, key: 'actualArrival' | 'actualDeparture') {
    if (!tour.id) return;
    const next = legs.map((l, i) => (i !== li ? l : { ...l, stops: l.stops.map((s, j) => (j === si ? { ...s, [key]: Date.now() } : s)) }));
    const flat = next.flatMap((l) => l.stops);
    const allOut = flat.length > 0 && flat.every((s) => s.actualDeparture);
    const anyIn = flat.some((s) => s.actualArrival);
    const status = allOut ? 'COMPLETED' : anyIn ? 'IN PROGRESS' : 'PLANNED';
    onUpdate(tour.id, { legs: next, amzStatus: status, sarvaStatus: status });
  }

  function saveOps() {
    if (!tour.id) return;
    onUpdate(tour.id, { present, remarks, totalManualKm: totalKm, amazonRelyKm: amazonKm, gpsKm, expenseAmount, expenseNote, invoiceGiven });
    setSaved(true); setTimeout(() => setSaved(false), 1500);
  }
  function setPhoto(key: 'kmPhotoImg' | 'invoicePhotoImg' | 'gpsPhotoImg', v: string | undefined) {
    if (tour.id) onUpdate(tour.id, { [key]: v ?? '' });
  }
  const late = (s: TourLegStop) => s.actualArrival && s.arrivalAt && s.actualArrival > new Date(s.arrivalAt).getTime();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-neutral-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="animate-scale-in flex max-h-[94vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-lift sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between px-5 py-4 text-white" style={{ background: INK }}>
          <div>
            <div className="flex items-center gap-2"><Truck size={16} style={{ color: ORANGE }} /><h3 className="font-mono text-base font-extrabold">{tour.tourId}</h3></div>
            <p className="mt-0.5 text-xs text-white/70">{tour.driver} · {tour.vehicleId}{tour.vendorName ? ` · ${tour.vendorName}` : ''}{showOwner && tour.ownerName ? ` · POC ${tour.ownerName}` : ''}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white"><X size={18} /></button>
        </div>

        <div className="px-5 pt-4">
          <div className="relative h-2 rounded-full" style={{ background: '#EDEFF1' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: '#067D62' }} />
            <div className="absolute -top-2.5 -translate-x-1/2 text-lg" style={{ left: `${pct}%` }}><span className={finished ? '' : 'inline-block animate-bounce'}>{finished ? '🏁' : '🚚'}</span></div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* per-VRID legs with check-in/out */}
          {legs.map((leg, li) => (
            <div key={li} className="mb-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded px-1.5 py-0.5 font-mono text-[11px] font-extrabold" style={{ background: '#EAF1F8', color: '#0F5C9E' }}>{leg.vrid}</span>
                <span className="text-[10px] font-bold uppercase text-neutral-400">{leg.loadType || 'Load'}</span>
              </div>
              <ol className="relative">
                {leg.stops.map((s, si) => {
                  const inDone = !!s.actualArrival, outDone = !!s.actualDeparture;
                  const globalIdx = legs.slice(0, li).flatMap((l) => l.stops).length + si;
                  const current = !outDone && (globalIdx === 0 || !!allStops[globalIdx - 1]?.actualDeparture);
                  return (
                    <li key={si} className="relative flex gap-3 pb-4 last:pb-0">
                      {si < leg.stops.length - 1 && <span className="absolute left-[13px] top-6 h-full w-0.5" style={{ background: outDone ? '#067D62' : '#D5D9D9' }} />}
                      <span className="z-10 flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded-full text-white ring-4 ring-white" style={{ background: outDone ? '#067D62' : current ? INK : '#c3c9cf' }}>
                        {outDone ? <Check size={15} /> : <span className="font-mono text-[11px] font-black">{si + 1}</span>}
                      </span>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <div className="flex flex-wrap items-center gap-2 text-sm font-bold" style={{ color: INK }}>
                          <span className="font-mono">{s.name}</span>
                          {current && !outDone && <span className="rounded-full px-2 py-0.5 text-[10px] font-extrabold" style={{ background: '#FFF3E0', color: '#B15C00' }}>Now</span>}
                          {late(s) && <span className="rounded-full px-2 py-0.5 text-[10px] font-extrabold" style={{ background: '#FCE9EC', color: '#B12704' }}>Late</span>}
                          {s.mapUrl && <a href={s.mapUrl} target="_blank" rel="noreferrer" className="text-[11px] font-bold" style={{ color: '#007185' }}>Map</a>}
                        </div>
                        <div className="mt-1 grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <div className="text-neutral-400">Arrival · plan {fmtDTShort(s.arrivalAt)}</div>
                            {s.actualArrival ? <div className="font-bold" style={{ color: '#067D62' }}>✓ In {fmtClock(s.actualArrival)}</div>
                              : current ? <button onClick={() => stampStop(li, si, 'actualArrival')} className="mt-0.5 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-white" style={{ background: INK }}><LogIn size={11} /> Check in</button>
                                : <div className="text-neutral-300">—</div>}
                          </div>
                          <div>
                            <div className="text-neutral-400">Departure · plan {fmtDTShort(s.departureAt)}</div>
                            {s.actualDeparture ? <div className="font-bold" style={{ color: '#067D62' }}>✓ Out {fmtClock(s.actualDeparture)}</div>
                              : inDone ? <button onClick={() => stampStop(li, si, 'actualDeparture')} className="mt-0.5 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold" style={{ background: ORANGE, color: INK }}><LogOut size={11} /> Check out</button>
                                : <div className="text-neutral-300">—</div>}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}

          {/* operational fields */}
          <div className="rounded-xl p-3 ring-1 ring-inset" style={{ background: '#F7F8F8', borderColor: '#D5D9D9' }}>
            <div className="mb-2 text-xs font-extrabold" style={{ color: INK }}>Trip updation</div>
            <Field label="Driver present?">
              <div className="grid grid-cols-2 gap-2">
                {['PRESENT', 'ABSENT'].map((m) => (
                  <button key={m} type="button" onClick={() => setPresent(m)} className="rounded-lg px-3 py-2 text-xs font-bold ring-1 ring-inset"
                    style={present === m ? { background: m === 'ABSENT' ? '#B12704' : INK, color: '#fff', borderColor: 'transparent' } : { background: '#fff', color: '#5A6572', borderColor: '#D5D9D9' }}>{m}</button>
                ))}
              </div>
            </Field>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <Field label="Total KM"><TextInput value={totalKm} onChange={(e) => setTotalKm(e.target.value)} placeholder="82" /></Field>
              <Field label="Amazon KM"><TextInput value={amazonKm} onChange={(e) => setAmazonKm(e.target.value)} placeholder="80" /></Field>
              <Field label="GPS KM"><TextInput value={gpsKm} onChange={(e) => setGpsKm(e.target.value)} placeholder="84" /></Field>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Field label="Expense (₹)"><TextInput value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} placeholder="0" /></Field>
              <Field label="Invoice given?">
                <div className="grid grid-cols-2 gap-2">
                  {[['Yes', true], ['No', false]].map(([lbl, val]) => (
                    <button key={String(lbl)} type="button" onClick={() => setInvoiceGiven(val as boolean)} className="rounded-lg px-2 py-2 text-xs font-bold ring-1 ring-inset"
                      style={invoiceGiven === val ? { background: INK, color: '#fff', borderColor: 'transparent' } : { background: '#fff', color: '#5A6572', borderColor: '#D5D9D9' }}>{lbl as string}</button>
                  ))}
                </div>
              </Field>
            </div>
            <div className="mt-2"><Field label="Expense note"><TextInput value={expenseNote} onChange={(e) => setExpenseNote(e.target.value)} placeholder="Toll / detention / repair…" /></Field></div>
            <div className="mt-2"><Field label="Remarks"><TextInput value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="On schedule / checkpost delay…" /></Field></div>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div><div className="mb-1 text-[11px] font-bold text-neutral-500">KM photo</div><ImageUpload value={tour.kmPhotoImg} onChange={(v) => setPhoto('kmPhotoImg', v)} label="Add KM photo" path={`tours/${tour.id}/km`} /></div>
              <div><div className="mb-1 text-[11px] font-bold text-neutral-500">Invoice photo</div><ImageUpload value={tour.invoicePhotoImg} onChange={(v) => setPhoto('invoicePhotoImg', v)} label="Add invoice" path={`tours/${tour.id}/invoice`} /></div>
              <div><div className="mb-1 text-[11px] font-bold text-neutral-500">GPS photo</div><ImageUpload value={tour.gpsPhotoImg} onChange={(v) => setPhoto('gpsPhotoImg', v)} label="Add GPS" path={`tours/${tour.id}/gps`} /></div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-neutral-100 px-5 py-3">
          <button onClick={saveOps} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-extrabold" style={{ background: ORANGE, color: INK }}>
            {saved ? <><Check size={15} /> Saved</> : <><Save size={15} /> Save updation</>}
          </button>
        </div>
      </div>
    </div>
  );
}
