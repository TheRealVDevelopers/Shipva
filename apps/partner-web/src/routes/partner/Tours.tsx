import { useEffect, useMemo, useState } from 'react';
import {
  Trash2, FileSpreadsheet, Search, X, Check, Route as RouteIcon, UserCog, ChevronRight, CalendarRange,
  LogIn, LogOut, Flag, AlertTriangle, Truck, Plus, Send, Save, Pencil, Fuel, Copy,
} from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Modal, Field, TextInput, DateTimeInput, Select, Row } from '../../components/ui/Modal.js';
import { LocationSuggest } from '../../components/LocationSuggest.js';
import { MultiImageUpload } from '../../components/ui/MultiImageUpload.js';
import {
  useStore, todayLabel, requestStatusLabel, dieselRequestFor, stageOf, ownerStageOf, legOps,
  type Tour, type TourLeg, type TourLegStop, type TourLegOps,
} from '../../lib/store.js';
import { isVerified } from '../../lib/mocks.js';
import { vendorStatus } from '../../lib/vendorDocs.js';
import { useAuth } from '../../lib/auth.js';
import { watchMembers, teamOf, type Member } from '../../lib/members.js';
import { canEditRecords, roleLabel } from '../../lib/roles.js';
import { vendorNamesOf, driversForVendor, trucksForVendor } from '../../lib/vendors.js';
import { Badge } from '../../components/ui/Badge.js';
import { vridHolder, updateTourLegs } from '../../lib/tours.js';
import { stopControls } from '../../lib/board.js';
import { exportAmazonSheet } from '../../lib/exportAmazonSheet.js';
import { exportRunHistory } from '../../lib/exportRuns.js';
import { exportAmazonTemplate } from '../../lib/exportAmazonTemplate.js';
import { vendorMessage, driverMessage, dieselRequestMessage, waLink } from '../../lib/tourMessages.js';
import { requiredError, phoneError, positiveError, normalizePhone, allClear } from '../../lib/validate.js';
import { useNotify } from '../../lib/notify.js';

const INK = '#232F3E';
const ORANGE = '#FF9900';
const OWN_FLEET = 'Sarva Express (own)';
// The live board is All / Shared. Drafts (part-filled Route Assigns) and
// Cancelled routes are kept out of it but reachable on their own tabs — the
// client's "when a route is deleted the Tour ID should be marked Cancelled".
const FILTERS = ['All', 'Shared', 'Drafts', 'Cancelled'] as const;
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

/** Clipboard fallback for browsers/origins without navigator.clipboard. */
function legacyCopy(text: string): boolean {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch { return false; }
}

const fmtClock = (ms: number) => new Date(ms).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
const fmtDTShort = (v?: string) => {
  if (!v) return '';
  const d = new Date(v);
  return isNaN(d.getTime()) ? v : d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
};

export function Tours() {
  const { tours, drivers, trucks, attached, customers, requests, addTour, updateTour, logTour, archiveTour, restoreTour } = useStore();
  const { member } = useAuth();
  const isAdmin = member?.role === 'owner' || member?.role === 'manager';
  const canAssign = isAdmin || member?.role === 'team_leader';
  const { push } = useNotify();
  const [members, setMembers] = useState<Member[]>([]);
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<Filter>('All');
  const [dateF, setDateF] = useState(''); // YYYY-MM-DD calendar filter
  const [open, setOpen] = useState(false);

  const [f, setF] = useState(EMPTY);
  const [legs, setLegs] = useState<LegDraft[]>([blankLeg()]);
  const [busy, setBusy] = useState(false);
  // Editing reuses the Route Assign form; delete needs the whole tour so its
  // VRIDs can be released.
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<Tour | null>(null);
  const canEdit = canEditRecords(member?.role);
  /** True while resuming a saved draft — the primary button then reads "Create". */
  const editingDraft = !!editId && !!tours.find((t) => t.id === editId)?.draft;
  // Step 2 of route creation: hand the new line to a POC.
  const [assignFor, setAssignFor] = useState<{ id: string; tourId: string; vrids: number } | null>(null);
  const [assignPoc, setAssignPoc] = useState('');
  // Bulk reassign — tick several lines and hand them over together. Held by id
  // so a live snapshot doesn't drop the selection mid-edit.
  const [picking, setPicking] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkTo, setBulkTo] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);
  // Diesel request (was "Open / Update") — the advance ask for a run.
  const [dieselId, setDieselId] = useState<string | null>(null);
  const diesel = dieselId ? tours.find((t) => t.id === dieselId) ?? null : null;

  useEffect(() => { if (canAssign) return watchMembers((l) => setMembers(l.filter((m) => m.status === 'active'))); }, [canAssign]);
  const assignable = isAdmin ? members : members.filter((m) => m.leaderUid === member?.uid || m.uid === member?.uid);

  // Strictly the vendor's own drivers/vehicles — no falling back to the full
  // list when a vendor has none on file. Showing another vendor's driver as
  // pickable is exactly what the client asked us to stop; an empty list is the
  // honest answer, and the field says so.
  // Only the drivers and vehicles linked to the chosen vendor — the client's
  // "only display linked vehicles and drivers in route assignments". Own fleet is
  // the no-vendor set; a named vendor matches by the name drivers/trucks store.
  // The registers a vendor name is resolved against. Passing this is what makes
  // the lists survive a vendor being renamed or an owner being put under a
  // transporter — without it, drivers registered under the old name vanish.
  const vendorBook = useMemo(() => ({ customers, owners: attached }), [customers, attached]);
  const vendorDrivers = useMemo(() => {
    if (!f.vendor) return [];
    return driversForVendor(drivers, f.vendor === OWN_FLEET ? '' : f.vendor, vendorBook);
  }, [drivers, f.vendor, vendorBook]);
  const vendorTrucks = useMemo(() => {
    if (!f.vendor) return [];
    return trucksForVendor(trucks, f.vendor === OWN_FLEET ? '' : f.vendor, vendorBook);
  }, [trucks, f.vendor, vendorBook]);
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
  // Block-if-not-approved (the client's rule): a vendor past their day-9
  // agreement deadline, or a truck/driver not yet document-verified, cannot be
  // put on a route. Own-fleet has no vendor to block.
  const selectedVendor = f.vendor && f.vendor !== OWN_FLEET
    ? (customers.find((c) => c.name === f.vendor)
        ?? attached.find((a) => (a.transporterName?.trim() || a.owner.trim()) === f.vendor))
    : undefined;
  const vendorBlocked = (() => {
    if (!selectedVendor) return false;
    const isOwner = 'owner' in selectedVendor;
    const approved = isOwner ? ownerStageOf(selectedVendor) === 'active' : stageOf(selectedVendor) === 'active';
    return vendorStatus(selectedVendor, { approved, hide: isOwner ? ['rateCard'] : [] }).level === 'blocked';
  })();
  const selDriver = drivers.find((d) => d.name === f.driver);
  const selTruck = trucks.find((t) => t.reg === f.vehicleId);
  const driverUnverified = !!selDriver && !isVerified(selDriver);
  const truckUnverified = !!selTruck && !isVerified(selTruck);

  // G-pay & advance are no longer part of creating a route — they're asked for
  // in the Diesel Request. Requiring them here would make the form unsavable.
  // Leadership must pick who the line is assigned to, in the form.
  const assignOk = !canAssign || !!f.handledBy;
  // The Trip ID is deliberately NOT unique. The same trip runs across several
  // routes — different vendors, vehicles and days can all sit under one ID, and
  // blocking that stopped legitimate work. Only the VRID is exclusive: it's
  // checked company-wide against the orgVrids registry on submit, and a
  // cancelled route releases its VRIDs so they can be entered again.
  const baseComplete = !!(f.serviceAt && f.vendor && f.driver && f.vehicleId && f.tourId.trim()) && assignOk;
  const valid = baseComplete && legs.length > 0 && legs.every(legComplete)
    && !vendorBlocked && !driverUnverified && !truckUnverified;

  const missing: string[] = [];
  if (!f.serviceAt) missing.push('service date & time');
  if (!f.vendor) missing.push('vendor');
  if (!f.driver) missing.push('driver');
  if (!f.vehicleId) missing.push('vehicle');
  if (!f.tourId.trim()) missing.push('trip ID');
  if (!assignOk) missing.push('assign it to an employee');
  if (!legs.every(legComplete)) missing.push('complete every VRID & its stops');

  // Hard blocks are shown apart from missing fields — a blocked vendor or an
  // unverified truck can't be assigned no matter what else is filled in.
  const blocks: string[] = [];
  if (vendorBlocked) blocks.push(`${f.vendor} is blocked — agreement overdue (past day ${8 + 1}). Approve it in Vendors Register first.`);
  if (driverUnverified) blocks.push(`Driver ${f.driver} isn't document-verified yet.`);
  if (truckUnverified) blocks.push(`Vehicle ${f.vehicleId} isn't document-verified yet.`);

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
    if (confirmDel.id) logTour(confirmDel.id, 'Route cancelled', { detail: `VRIDs released: ${tourVridList(confirmDel).join(', ') || 'none'}` });
    archiveTour(confirmDel);
    push({
      title: 'Route cancelled',
      body: `${confirmDel.tourId || 'Route'} marked Cancelled — its VRID${tourVridCount(confirmDel) === 1 ? ' is' : 's are'} free to reassign. The record is kept.`,
      tone: 'info',
    });
    setConfirmDel(null);
  }

  /** Put a cancelled route back on the board, re-claiming its VRIDs. */
  async function doRestore(t: Tour) {
    const clash = await restoreTour(t);
    if (clash) {
      push({ title: "Can't restore", body: `VRID ${clash} has since been used on another route. Free it there first.`, tone: 'warning' });
      return;
    }
    if (t.id) logTour(t.id, 'Route restored', { detail: `VRIDs re-claimed: ${tourVridList(t).join(', ') || 'none'}` });
    push({ title: 'Route restored', body: `${t.tourId || 'Route'} is back on the board as Planned.`, tone: 'success' });
  }

  const toggleOne = (id: string) => setSelected((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  /** Reassign — and log — every ticked line in one go. */
  function reassignSelected(uid: string) {
    const m = assignable.find((x) => x.uid === uid);
    if (!m) return;
    let n = 0;
    tours.forEach((t) => {
      if (!t.id || !selected.has(t.id)) return;
      updateTour(t.id, { ownerUid: m.uid, ownerName: m.name, leaderUid: teamOf(m) },
        { action: t.ownerName ? 'Reassigned' : 'Assigned', detail: `${t.ownerName ? `${t.ownerName} → ` : ''}${m.name}` });
      n++;
    });
    push({ title: 'Reassigned', body: `${n} line${n === 1 ? '' : 's'} handed to ${m.name}.`, tone: 'success' });
    setBulkOpen(false); setBulkTo(''); setSelected(new Set()); setPicking(false);
  }

  /**
   * Build the tour record from whatever the form currently holds. Shared by the
   * real save and "Save as draft" — a draft is the same record with `draft` set
   * and no validation, so resuming it later refills the form exactly.
   */
  function buildCore() {
    const tourLegs: TourLeg[] = legs.map((l) => ({
      vrid: l.vrid.trim().toUpperCase(), loadType: l.loadType,
      stops: l.stops.map((s) => ({ name: s.name.trim().toUpperCase(), mapUrl: s.mapUrl.trim(), location: s.mapUrl.trim(), arrivalAt: s.arrivalAt, departureAt: s.departureAt })),
    }));
    const svc = new Date(f.serviceAt);
    return {
      tourLegs,
      core: {
        date: isNaN(svc.getTime()) ? todayLabel() : svc.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        serviceAt: f.serviceAt,
        tourId: f.tourId.trim(), vrId: tourLegs[0]?.vrid ?? '', vrIds: tourLegs.map((l) => l.vrid), legs: tourLegs,
        amzEquipmentType: vehicleFeet, seEquipmentType: vehicleFeet,
        scheduleAdhoc: f.tripType, noLoadLoad: legs[0]?.loadType ?? 'Load',
        advanceAmount: f.advanceAmount, paidPending: f.paidPending, gpayName: f.gpayName.trim(), gpayNumber: f.gpayNumber.trim(),
        driver: f.driver, vehicleId: f.vehicleId, driverNumber: f.driverNumber, vendorName: f.vendor === OWN_FLEET ? 'Sarva Express' : f.vendor,
      },
    };
  }

  /** Who the line is (or will be) handled by, for both save paths. */
  function currentHandler() {
    const handler = canAssign && f.handledBy ? members.find((m) => m.uid === f.handledBy) ?? null : null;
    return handler
      ? { uid: handler.uid, name: handler.name, leaderUid: teamOf(handler) }
      : (member ? { uid: member.uid, name: member.name, leaderUid: teamOf(member) } : undefined);
  }

  /**
   * Save a part-filled Route Assign — the client's point 7. No validation, no
   * VRID claim, not on the board: just the form as it stands, so a POC
   * interrupted mid-entry can pick it up later from the Drafts tab.
   */
  async function saveDraft() {
    if (busy) return;
    setBusy(true);
    try {
      const { core } = buildCore();
      const handledBy = currentHandler();
      if (editId) {
        updateTour(editId, { ...core, draft: true });
        push({ title: 'Draft saved', body: `${f.tourId.trim() || 'Untitled route'} — resume it from the Drafts tab.`, tone: 'info' });
      } else {
        await addTour({
          ...core, draft: true,
          seTracker: '', toll: '',
          amzStatus: 'PLANNED', sarvaStatus: 'PLANNED', present: 'PRESENT',
          stops: [], totalManualKm: '', amazonRelyKm: '', gpsKm: '', remarks: '',
        }, handledBy);
        push({ title: 'Draft saved', body: `${f.tourId.trim() || 'Untitled route'} — resume it from the Drafts tab.`, tone: 'info' });
      }
      resetForm(); setOpen(false);
    } finally { setBusy(false); }
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
      const { core } = buildCore();
      const handledBy = currentHandler();

      if (editId) {
        const existing = tours.find((t) => t.id === editId);
        if (existing) {
          // Keep the POC's own work — statuses, KM, photos, check-ins — and
          // re-point the VRID registry at this route, freeing any it dropped.
          // Publishing a draft clears the flag and claims its VRIDs for real.
          await updateTourLegs(existing, {
            ...core, draft: false,
            ...(handledBy ? { ownerUid: handledBy.uid, ownerName: handledBy.name, leaderUid: handledBy.leaderUid } : {}),
          }, member?.uid ?? '');
          logTour(existing.id, existing.draft ? 'Route created from draft' : 'Route edited',
            { detail: `${core.vrIds.length} VRID(s): ${core.vrIds.join(', ')}` });
          push({ title: existing.draft ? 'Route created' : 'Route updated', body: `${f.tourId} saved.`, tone: 'success' });
        }
      } else {
        const id = await addTour({
          ...core,
          seTracker: '', toll: '',
          amzStatus: 'PLANNED', sarvaStatus: 'PLANNED', present: 'PRESENT',
          stops: [], totalManualKm: '', amazonRelyKm: '', gpsKm: '', remarks: '',
        }, handledBy);
        const who = handledBy?.name ? ` · assigned to ${handledBy.name}` : '';
        push({ title: 'Route created', body: `${f.tourId} · ${legs.length} VRID${legs.length > 1 ? 's' : ''}${who}.`, tone: 'success' });
        // Assignment happened in the form — no after-create step. Existing lines
        // are reassigned from the row's Assign/Reassign button.
      }
      resetForm(); setOpen(false);
    } finally { setBusy(false); }
  }

  // The board shows live routes only; drafts and cancelled ones have their own
  // tabs so nothing silently disappears.
  const live = tours.filter((t) => !t.archived && !t.draft);
  const drafts = tours.filter((t) => t.draft && !t.archived);
  const cancelled = tours.filter((t) => t.archived);
  const pool = tab === 'Drafts' ? drafts : tab === 'Cancelled' ? cancelled : live;
  const shown = pool.filter((t) => {
    if (tab === 'Shared' && !isShared(t)) return false;
    // Calendar filter: the run's service date (or, failing that, its date label).
    if (dateF && (t.serviceAt ? t.serviceAt.slice(0, 10) !== dateF : true)) return false;
    if (!q) return true;
    const hay = `${t.tourId} ${(t.legs ?? []).map((l) => l.vrid).join(' ')} ${(t.vrIds ?? []).join(' ')} ${t.vehicleId} ${t.amzEquipmentType} ${t.vendorName} ${t.driver} ${t.ownerName ?? ''}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  const inTransit = live.filter((t) => t.amzStatus === 'IN PROGRESS').length;
  const completed = live.filter((t) => t.amzStatus === 'COMPLETED').length;
  const advTotal = tours.reduce((s, t) => s + (Number(t.advanceAmount) || 0), 0);

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
              <div className="flex flex-1 items-center gap-2 rounded-lg bg-white/10 px-3 py-2 ring-1 ring-inset ring-white/15 sm:w-64">
                <Search size={14} className="text-white/60" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search VRID / trip ID / vehicle / vendor" className="w-full bg-transparent text-xs text-white outline-none placeholder:text-white/45" />
              </div>
              {/* Calendar date filter — the client's "add a calendar date filter". */}
              <div className="flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-2 ring-1 ring-inset ring-white/15">
                <CalendarRange size={14} className="text-white/60" />
                <input type="date" value={dateF} onChange={(e) => setDateF(e.target.value)} aria-label="Filter by date"
                  className="bg-transparent text-xs text-white outline-none [color-scheme:dark]" />
                {dateF && <button onClick={() => setDateF('')} className="text-white/50 hover:text-white" title="Clear date"><X size={13} /></button>}
              </div>
              {/* Export is Admin/TL only, per the client. Two sheets: the full
                  detail export (everything but the map links, one row per VRID)
                  and Amazon's own 54-column operational template. */}
              {canEdit && (
                <>
                  <button onClick={() => void exportAmazonTemplate({ tours: shown, requests, name: 'amazon-export' }).then((n) => push({ title: 'Exported', body: `${n} VRID row${n === 1 ? '' : 's'} in your Amazon template.`, tone: 'success' }))}
                    className="hidden items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-white ring-1 ring-inset ring-white/15 hover:bg-white/15 sm:inline-flex"
                    title="Your Amazon workbook layout, one row per VR ID, plus created/updated by and the full update history"><FileSpreadsheet size={13} /> Export</button>
                  <button onClick={() => { const n = exportRunHistory({ tours: shown, requests, name: 'amazon-tours' }); push({ title: 'History exported', body: `${n} update${n === 1 ? '' : 's'} downloaded.`, tone: 'success' }); }}
                    className="hidden items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-white ring-1 ring-inset ring-white/15 hover:bg-white/15 sm:inline-flex"
                    title="Every individual update, one per row — who changed what and when"><FileSpreadsheet size={13} /> Update history</button>
                  <button onClick={() => exportAmazonSheet(shown)} className="hidden items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-white ring-1 ring-inset ring-white/15 hover:bg-white/15 sm:inline-flex" title="Amazon's own 54-column sheet"><FileSpreadsheet size={13} /> Amazon sheet</button>
                </>
              )}
              {/* Bulk reassign — tick several lines and hand them over at once. */}
              {canAssign && (
                <button onClick={() => { setPicking((v) => !v); setSelected(new Set()); }}
                  className="hidden items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-white ring-1 ring-inset ring-white/15 hover:bg-white/15 sm:inline-flex"
                  title="Select multiple lines to reassign at once">
                  <UserCog size={13} /> {picking ? 'Cancel select' : 'Select to reassign'}
                </button>
              )}
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
            // Drafts and Cancelled carry a count — they're easy to forget about.
            const n = x === 'Drafts' ? drafts.length : x === 'Cancelled' ? cancelled.length : 0;
            return (
              <button key={x} onClick={() => setTab(x)} className="relative whitespace-nowrap px-4 py-2.5 text-[13px] font-bold transition" style={{ color: on ? INK : '#5A6572' }}>
                {x}{n > 0 && <span className="ml-1.5 rounded-full bg-neutral-200 px-1.5 py-0.5 text-[10px] font-extrabold text-neutral-600">{n}</span>}
                {on && <span className="absolute inset-x-2 -bottom-px h-[3px] rounded-t" style={{ background: ORANGE }} />}
              </button>
            );
          })}
        </div>

        {/* Bulk-reassign action bar — above the list while selecting. */}
        {picking && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-primary-50 px-4 py-2.5 ring-1 ring-inset ring-primary-100">
            <div className="flex items-center gap-3 text-xs font-bold text-primary-800">
              <button onClick={() => setSelected(new Set(shown.map((t) => t.id!).filter(Boolean)))} className="underline hover:text-primary-900">Select all {shown.length} shown</button>
              {selected.size > 0 && <button onClick={() => setSelected(new Set())} className="underline hover:text-primary-900">Clear</button>}
              <span>{selected.size} selected</span>
            </div>
            <button onClick={() => setBulkOpen(true)} disabled={selected.size === 0}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-extrabold text-white disabled:opacity-40" style={{ background: INK }}>
              <UserCog size={13} /> Reassign {selected.size || ''}
            </button>
          </div>
        )}

        {/* Compact list — a dense row per line, built for 100+ tours (client's
            call: replace the big card layout with a compact list/table). */}
        <div className="overflow-hidden rounded-xl bg-white shadow-sm" style={{ border: '1px solid #D5D9D9' }}>
          <div className="divide-y" style={{ borderColor: '#EDEFF1' }}>
            {shown.map((t) => (
              <div key={t.id} className={`flex items-start ${picking && t.id && selected.has(t.id) ? 'bg-primary-50/50' : ''}`}>
                {picking && (
                  <label className="flex cursor-pointer items-center py-3 pl-4">
                    <input type="checkbox" checked={!!t.id && selected.has(t.id)} onChange={() => t.id && toggleOne(t.id)}
                      className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-400" aria-label={`Select ${t.tourId}`} />
                  </label>
                )}
                <div className="min-w-0 flex-1">
                  <TourRow t={t} isAdmin={isAdmin} canEdit={canEdit} canAssign={canAssign}
                    state={t.archived ? 'cancelled' : t.draft ? 'draft' : 'live'}
                    onDiesel={() => t.id && setDieselId(t.id)}
                    onAssign={() => { setAssignPoc(t.ownerUid ?? ''); setAssignFor({ id: t.id!, tourId: t.tourId, vrids: t.legs?.length ?? 0 }); }}
                    onEdit={() => startEdit(t)} onDelete={() => setConfirmDel(t)} onShare={updateTour}
                    onRestore={() => void doRestore(t)} />
                </div>
              </div>
            ))}
            {shown.length === 0 && (
              <div className="py-12 text-center text-sm text-neutral-400">
                {tab === 'Drafts' ? 'No drafts — a part-filled Route Assign saved with "Save as draft" appears here.'
                  : tab === 'Cancelled' ? 'No cancelled routes. A cancelled route is kept here and its VRIDs are freed for reuse.'
                    : tours.length === 0 ? 'No lines yet — press "Route Assign" to add your first Amazon tour.' : 'No lines match this view.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Route Assign ──────────────────────────────────────────────── */}
      <Modal open={open} onClose={() => setOpen(false)} title="Route Assign"
        subtitle="Assign an Amazon line — every field must be filled to create, or save it as a draft and finish later"
        onSubmit={submit} submitLabel={busy ? 'Checking VRIDs…' : editingDraft ? 'Create route' : editId ? 'Save route' : 'Create route'}
        submitDisabled={!valid || busy}
        secondaryLabel={busy ? 'Saving…' : 'Save as draft'} onSecondary={() => void saveDraft()} secondaryDisabled={busy}
        wide>
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
            {/* Transporters and truck owners both, matching what a truck or driver
                stores in its vendor field, so linkage filtering lines up. */}
            {vendorNamesOf(customers, attached).map((v) => <option key={v} value={v}>{v}</option>)}
          </Select>
        </Field>
        <Row>
          {/* An empty list used to be a blank dropdown with no explanation —
              which is how a vendor-rename silently looked like a broken app.
              Say what's happening and where to fix it. */}
          <Field label="Driver name"
            error={f.vendor && vendorDrivers.length === 0 ? `No drivers are registered under ${f.vendor}. Add one in Driver Register.` : undefined}>
            <Select value={f.driver} onChange={(e) => pickDriver(e.target.value)} disabled={!f.vendor}>
              <option value="">{f.vendor ? (vendorDrivers.length ? 'Select driver' : 'No drivers for this vendor') : 'Pick vendor first'}</option>
              {vendorDrivers.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
            </Select>
          </Field>
          <Field label="Vehicle number"
            error={f.vendor && vendorTrucks.length === 0 ? `No vehicles are registered under ${f.vendor}. Add one in Truck Register.` : undefined}>
            <Select value={f.vehicleId} onChange={(e) => setF({ ...f, vehicleId: e.target.value })} disabled={!f.vendor}>
              <option value="">{f.vendor ? (vendorTrucks.length ? 'Select vehicle' : 'No vehicles for this vendor') : 'Pick vendor first'}</option>
              {vendorTrucks.map((t) => <option key={t.id} value={t.reg}>{t.reg}{t.feet ? ` · ${t.feet}` : ''}</option>)}
            </Select>
          </Field>
        </Row>
        <Row>
          <Field label="Driver number"><TextInput value={f.driverNumber} onChange={(e) => setF({ ...f, driverNumber: e.target.value })} placeholder="auto-fills from driver" /></Field>
          <Field label="Vehicle type" hint="Auto from the vehicle's feet"><TextInput value={vehicleFeet || (f.vehicleId ? '—' : '')} disabled placeholder="pick a vehicle" /></Field>
        </Row>
        <Field label="Trip ID (manual entry)"><TextInput value={f.tourId} onChange={(e) => setF({ ...f, tourId: e.target.value })} placeholder="T-30FPN0493" /></Field>
        {/* Assign this line to an employee here in the form — required. Only they
            see and update it. Existing lines are reassigned from the row button. */}
        {canAssign && (
          <Field label="Assign to" required hint={isAdmin ? 'The employee who runs and updates this line' : 'Which of your POCs runs this line'}>
            <Select value={f.handledBy} onChange={(e) => setF({ ...f, handledBy: e.target.value })}>
              <option value="">— Assign to an employee —</option>
              {assignable.map((m) => <option key={m.uid} value={m.uid}>{m.name}{m.uid === member?.uid ? ' (me)' : ''}</option>)}
            </Select>
          </Field>
        )}
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
                      {/* Location Master typeahead — type a saved code and the
                          pick fills the stop name + maps link together. */}
                      <Field label="Stop name"><LocationSuggest upper value={s.name} onChange={(name) => setLegStop(li, si, { name })}
                        onPick={(loc) => setLegStop(li, si, { name: loc.name.toUpperCase(), mapUrl: loc.mapUrl })}
                        placeholder="HKR3" className="font-mono" /></Field>
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
        {blocks.length > 0 && (
          <div className="rounded-lg bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-100">
            {blocks.map((b, i) => <div key={i} className="flex items-start gap-1.5"><AlertTriangle size={12} className="mt-px shrink-0" /> {b}</div>)}
          </div>
        )}
        {missing.length > 0 && <p className="text-[11px] font-semibold" style={{ color: '#B15C00' }}>To create, still needed: {missing.join(' · ')}.</p>}
      </Modal>

      {/* Bulk reassign — every ticked line, to one employee, together */}
      {bulkOpen && canAssign && (
        <Modal open onClose={() => setBulkOpen(false)}
          title={`Reassign ${selected.size} line${selected.size === 1 ? '' : 's'}`}
          subtitle="They all move to the same employee"
          onSubmit={() => reassignSelected(bulkTo)}
          submitLabel={`Reassign ${selected.size}`} submitDisabled={!bulkTo}>
          <Field label="Assign to" required hint={isAdmin ? 'Only this employee sees and updates the selected lines' : 'Which of your POCs runs these lines'}>
            <Select value={bulkTo} onChange={(e) => setBulkTo(e.target.value)}>
              <option value="">— Assign to an employee —</option>
              {assignable.map((m) => <option key={m.uid} value={m.uid}>{m.name}{m.uid === member?.uid ? ' (me)' : ''}</option>)}
            </Select>
          </Field>
          <p className="rounded-lg px-3 py-2 text-[11px] text-neutral-500 ring-1 ring-inset ring-neutral-200" style={{ background: '#F7F8F8' }}>
            {tours.filter((t) => t.id && selected.has(t.id)).map((t) => t.tourId).slice(0, 8).join(', ')}
            {selected.size > 8 ? ` +${selected.size - 8} more` : ''}
          </p>
        </Modal>
      )}

      {/* Reassign an existing line — opened from the row's Assign/Reassign button.
          (New lines are assigned in the Route Assign form itself.) */}
      {assignFor && canAssign && (() => {
        const cur = tours.find((t) => t.id === assignFor.id);
        const reassigning = !!cur?.ownerName;
        return (
          <Modal open onClose={() => setAssignFor(null)} title={reassigning ? 'Reassign line' : 'Assign line'}
            subtitle={reassigning ? `${assignFor.tourId} · currently ${cur?.ownerName}` : `${assignFor.tourId} · not assigned`}
            onSubmit={() => {
              const m = assignable.find((x) => x.uid === assignPoc);
              if (m) {
                updateTour(assignFor.id, { ownerUid: m.uid, ownerName: m.name, leaderUid: teamOf(m) },
                  { action: reassigning ? 'Reassigned' : 'Assigned', detail: `${cur?.ownerName ? `${cur.ownerName} → ` : ''}${m.name}` });
                push({ title: reassigning ? 'Reassigned' : 'Assigned', body: `${assignFor.tourId} handed to ${m.name}.`, tone: 'success' });
              }
              setAssignFor(null);
            }}
            submitLabel={reassigning ? 'Reassign' : 'Assign'} submitDisabled={!assignPoc}>
            <Field label="Assign to" required hint={isAdmin ? 'The employee who runs and updates this line — nobody else sees it' : 'Which of your POCs runs this line'}>
              <Select value={assignPoc} onChange={(e) => setAssignPoc(e.target.value)}>
                <option value="">— Assign to an employee —</option>
                {assignable.map((m) => <option key={m.uid} value={m.uid}>{m.name}{m.uid === member?.uid ? ' (me)' : ''}</option>)}
              </Select>
            </Field>
          </Modal>
        );
      })()}


      {/* ── Diesel Request ────────────────────────────────────────────────
          The advance ask for a run. G-pay details live here now rather than on
          Route Assign — the money is settled per-run, not when the line is
          planned. Sends the client's exact message format. */}
      {diesel && (
        <DieselRequest tour={diesel} onClose={() => setDieselId(null)} onSave={updateTour} />
      )}

      {/* Cancel / archive route — never a hard delete (the client's rule). */}
      {confirmDel && (
        <Modal open onClose={() => setConfirmDel(null)} title={`Cancel ${confirmDel.tourId || 'this route'}?`}
          subtitle="Archived, not deleted" onSubmit={doDelete} submitLabel="Cancel route">
          <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800 ring-1 ring-inset ring-amber-100">
            <b>{confirmDel.tourId || 'This route'}</b>{confirmDel.driver ? ` (${confirmDel.driver}, ${confirmDel.vehicleId})` : ''} will be <b>archived and removed from the board</b> for the whole team.
            The record is kept — including any check-ins, KM readings and photos the POC recorded — nothing is permanently deleted.
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
  tour: Tour; onClose: () => void;
  onSave: (id: string, patch: Partial<Tour>, log?: { action: string; detail?: string; vrid?: string }) => void;
}) {
  const { push } = useNotify();
  const { member } = useAuth();
  const { requests, addRequest } = useStore();
  const [gpayName, setGpayName] = useState(tour.gpayName ?? '');
  const [gpayNumber, setGpayNumber] = useState(tour.gpayNumber ?? '');
  const [advanceAmount, setAdvanceAmount] = useState(tour.advanceAmount ?? '');

  const errs = {
    gpayName: requiredError(gpayName, 'Name'),
    gpayNumber: phoneError(gpayNumber, { label: 'G-pay number' }),
    advanceAmount: positiveError(advanceAmount, 'Advance amount'),
  };
  const [tried, setTried] = useState(false);
  const ready = allClear(errs);

  // Preview exactly what will be sent, built from the same builder as the send.
  const preview = dieselRequestMessage({ ...tour, gpayName, gpayNumber, advanceAmount });

  // One request per route: re-sending the message must not stack up a second
  // pending row for the accountant to chase.
  const existing = dieselRequestFor(requests, tour.id);

  function save(andSend: boolean) {
    setTried(true);
    if (!ready) return;
    const patch = { gpayName: gpayName.trim(), gpayNumber: normalizePhone(gpayNumber), advanceAmount: advanceAmount.trim() };
    onSave(tour.id, patch, {
      action: existing ? 'Diesel request re-sent' : 'Diesel advance requested',
      detail: `₹${advanceAmount.trim() || '0'} to ${gpayName.trim()} (${normalizePhone(gpayNumber)})`,
    });

    // The request itself goes to Expenses & Fuel, where it's marked paid or
    // rejected — the status is no longer something this form decides.
    if (!existing) {
      addRequest({
        raisedBy: member ? `${member.name} · ${roleLabel(member.role)}` : 'Staff',
        kind: 'diesel',
        title: `Diesel advance · ${gpayName.trim()}`,
        amountPaise: Math.round(Number(advanceAmount) * 100),
        tourId: tour.id,
        tourCode: tour.tourId || tour.vrId || '',
        note: `G-pay ${normalizePhone(gpayNumber)} · ${tour.vehicleId}`,
        // Snapshot the run's detail so the accountant can settle the advance
        // without opening the route (client point 11).
        vendorName: tour.vendorName, driver: tour.driver, driverNumber: tour.driverNumber,
        vehicleId: tour.vehicleId, vrids: tourVridList(tour),
        gpayName: gpayName.trim(), gpayNumber: normalizePhone(gpayNumber),
        ...(tour.serviceAt ? { serviceAt: tour.serviceAt } : {}),
      });
    }

    if (andSend) {
      window.open(waLink(gpayNumber, dieselRequestMessage({ ...tour, ...patch })), '_blank');
      push({ title: 'Diesel request sent', body: `₹${advanceAmount} to ${gpayName.trim()} — now pending in Expenses & Fuel.`, tone: 'success' });
    } else {
      push({ title: 'Diesel request saved', body: `₹${advanceAmount} for ${tour.tourId} — pending in Expenses & Fuel.`, tone: 'success' });
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
      <Field label="Advance Amount (₹)" required error={tried ? errs.advanceAmount : undefined}>
        <TextInput type="number" value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} placeholder="5000" />
      </Field>

      {/* Paid/Pending is no longer typed here — the request goes to Expenses &
          Fuel and whoever handles the money marks it paid or rejects it. */}
      <div className="flex items-center justify-between rounded-lg bg-sky-50 px-3 py-2 text-[11px] text-sky-800 ring-1 ring-inset ring-sky-100">
        <span>{existing ? 'Already raised — status is set in Expenses & Fuel.' : 'This will appear in Expenses & Fuel to be marked paid or rejected.'}</span>
        {existing && <Badge tone={existing.status === 'approved' ? 'success' : existing.status === 'rejected' ? 'danger' : 'warning'}>{requestStatusLabel(existing)}</Badge>}
      </div>

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

/**
 * One line, one dense row — the compact list the client asked for in place of
 * the big cards (better for 100+ tours). Expands to show the per-VRID stop chain
 * and the WhatsApp share/copy actions; collapsed it's ID, route summary, driver,
 * status, and the two primary actions (diesel + share).
 */
function TourRow({ t, isAdmin, canEdit, canAssign, state, onDiesel, onEdit, onDelete, onShare, onAssign, onRestore }: {
  t: Tour; isAdmin: boolean; canEdit: boolean; canAssign: boolean;
  /** Which tab this row is on — a draft or a cancelled route can't be shared,
   *  fuelled or assigned; a cancelled one can be restored. */
  state: 'live' | 'draft' | 'cancelled';
  onDiesel: () => void; onEdit: () => void; onDelete: () => void; onAssign: () => void;
  onShare: (id: string, patch: Partial<Tour>) => void; onRestore: () => void;
}) {
  const legs = t.legs && t.legs.length ? t.legs : [];
  const allStops = legs.flatMap((l) => l.stops);
  const done = allStops.filter((s) => s.actualDeparture).length;
  const pct = allStops.length ? Math.round((done / allStops.length) * 100) : 0;
  const pill = statusPill(t.amzStatus);
  const vlist = legs.length ? legs.map((l) => l.vrid) : (t.vrIds ?? (t.vrId ? [t.vrId] : []));
  const routeText = allStops.map((s) => s.name).join(' → ') || '—';

  const { requests } = useStore();
  const diesel = dieselRequestFor(requests, t.id);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  /**
   * The share links are real anchors, not window.open — a popup blocker will
   * swallow a programmatic window.open but never a user's click on a link, and
   * "the share button does nothing" was exactly the client's complaint. The
   * href is built up-front so the tap opens WhatsApp immediately; marking the
   * line as shared happens alongside and never delays the navigation.
   */
  const shareHref = (kind: 'vendor' | 'driver') =>
    waLink(kind === 'vendor' ? (t.gpayNumber ?? '') : (t.driverNumber ?? ''),
      kind === 'vendor' ? vendorMessage(t) : driverMessage(t));
  const markShared = (kind: 'vendor' | 'driver') => {
    if (t.id) onShare(t.id, kind === 'vendor' ? { sharedVendor: true } : { sharedDriver: true });
  };

  /** Copy with a fallback — navigator.clipboard is unavailable on insecure
   *  origins and in some in-app browsers, where it used to fail silently. */
  function copyMsg(text: string) {
    const done = () => { setCopied(true); window.setTimeout(() => setCopied(false), 1600); };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => legacyCopy(text) && done());
      return;
    }
    if (legacyCopy(text)) done();
  }

  return (
    <div className={open ? 'bg-neutral-50/60' : 'hover:bg-neutral-50/60'}>
      {/* Collapsed dense row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2.5">
        <button onClick={() => setOpen((o) => !o)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <ChevronRight size={14} className={`shrink-0 text-neutral-400 transition-transform ${open ? 'rotate-90' : ''}`} />
          <span className="font-mono text-sm font-extrabold" style={{ color: INK }}>{t.tourId}</span>
          <span className="rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase" style={{ background: t.scheduleAdhoc === 'ADHOC' ? '#FFF3E0' : '#EDEFF1', color: t.scheduleAdhoc === 'ADHOC' ? '#B15C00' : '#5A6572' }}>{t.scheduleAdhoc}</span>
          <span className="truncate text-xs text-neutral-500">{routeText}</span>
        </button>
        <div className="flex shrink-0 items-center gap-2 text-[11px] text-neutral-500">
          {t.amzEquipmentType && <span>{t.amzEquipmentType}</span>}
          <span className="font-mono">{t.vehicleId || '—'}</span>
          <span className="hidden sm:inline">{t.driver || '—'}</span>
          {isAdmin && t.ownerName && <span className="inline-flex items-center gap-1 rounded bg-neutral-100 px-1.5 py-0.5 font-bold text-neutral-600" title="POC"><UserCog size={10} /> {t.ownerName}</span>}
          <span className="rounded-full px-2 py-0.5 text-[10px] font-extrabold" style={{ background: pill.bg, color: pill.fg }}>{pill.label}</span>
          {pct > 0 && pct < 100 && <span className="tabular-nums text-neutral-400">{pct}%</span>}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {state === 'cancelled' ? (
            <>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-extrabold" style={{ background: '#FCE9EC', color: '#B12704' }}>Cancelled</span>
              {canEdit && (
                <button onClick={onRestore} className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-extrabold"
                  style={{ borderColor: '#D5D9D9', color: '#0F5C9E', background: '#fff' }}
                  title="Put this route back on the board and re-claim its VRIDs">
                  <RouteIcon size={12} /> Restore
                </button>
              )}
            </>
          ) : state === 'draft' ? (
            <>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-extrabold" style={{ background: '#EDEFF1', color: '#5A6572' }}>Draft</span>
              {canEdit && (
                <>
                  <button onClick={onEdit} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-extrabold shadow-sm" style={{ background: ORANGE, color: INK }}>
                    <Pencil size={12} /> Resume
                  </button>
                  <button onClick={onDelete} className="rounded-lg p-1.5 text-neutral-400 hover:bg-amber-50 hover:text-amber-600" title="Discard this draft"><Trash2 size={14} /></button>
                </>
              )}
            </>
          ) : (
          <>
          {/* Share & copy sit on the collapsed row — the client asked for them
              to work instantly, and they used to need the row expanded first. */}
          <a href={shareHref('vendor')} target="_blank" rel="noreferrer noopener" onClick={() => markShared('vendor')}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-white" style={{ background: '#25D366' }}
            title="Send the payment details to the vendor on WhatsApp">
            <Send size={12} /> Vendor {t.sharedVendor && <Check size={11} />}
          </a>
          <a href={shareHref('driver')} target="_blank" rel="noreferrer noopener" onClick={() => markShared('driver')}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-white" style={{ background: '#25D366' }}
            title="Send the full route to the driver on WhatsApp">
            <Send size={12} /> Driver {t.sharedDriver && <Check size={11} />}
          </a>
          <button onClick={() => copyMsg(driverMessage(t))} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-primary-600"
            title="Copy the driver message exactly as laid out">
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
          </button>
          <button onClick={onDiesel} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-extrabold shadow-sm" style={{ background: ORANGE, color: INK }}><Fuel size={12} /> Diesel</button>
          {diesel && (
            <Badge tone={diesel.status === 'approved' ? 'success' : diesel.status === 'rejected' ? 'danger' : 'warning'}><Fuel size={10} /> {requestStatusLabel(diesel)}</Badge>
          )}
          {canAssign && (
            <button onClick={onAssign} className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-extrabold"
              style={{ borderColor: t.ownerName ? '#D5D9D9' : ORANGE, color: t.ownerName ? '#475467' : '#B45309', background: t.ownerName ? '#fff' : '#FFF7ED' }}
              title={t.ownerName ? `Assigned to ${t.ownerName} — tap to reassign` : 'Not assigned — tap to assign'}>
              <UserCog size={12} /> {t.ownerName ? 'Reassign' : 'Assign'}
            </button>
          )}
          {canEdit && (
            <>
              <button onClick={onEdit} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-primary-600" title="Edit route"><Pencil size={14} /></button>
              <button onClick={onDelete} className="rounded-lg p-1.5 text-neutral-400 hover:bg-amber-50 hover:text-amber-600" title="Cancel route — keeps the record, frees the Tour ID & VRIDs"><Trash2 size={14} /></button>
            </>
          )}
          </>
          )}
        </div>
      </div>

      {/* Expanded: per-VRID legs + WhatsApp share */}
      {open && (
        <div className="px-4 pb-3">
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
                      <span className="h-2 w-2 rounded-full" style={{ background: s.actualDeparture ? '#067D62' : s.actualArrival ? ORANGE : '#c3c9cf' }} />
                      <span className="font-mono">{s.name}</span>
                      {j < leg.stops.length - 1 && <span className="text-neutral-300">→</span>}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {legs.length === 0 && <div className="text-xs text-neutral-400">VR IDs: {vlist.join(', ') || '—'}</div>}
          </div>

          <div className="mt-2 text-[11px] text-neutral-400">{t.date} · {t.vendorName || '—'} · Adv ₹{Number(t.advanceAmount || 0).toLocaleString('en-IN')}</div>

          {/* Full-width share row — same actions as the collapsed row, with the
              vendor message also copyable on its own. */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">Share</span>
            <a href={shareHref('vendor')} target="_blank" rel="noreferrer noopener" onClick={() => markShared('vendor')}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white" style={{ background: '#25D366' }}>
              <Send size={12} /> Vendor {t.sharedVendor && <Check size={12} />}
            </a>
            <a href={shareHref('driver')} target="_blank" rel="noreferrer noopener" onClick={() => markShared('driver')}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white" style={{ background: '#25D366' }}>
              <Send size={12} /> Driver {t.sharedDriver && <Check size={12} />}
            </a>
            <button onClick={() => copyMsg(driverMessage(t))} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold ring-1 ring-inset" style={{ color: INK, borderColor: '#D5D9D9' }} title="Copy the driver message exactly as laid out">
              {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy route</>}
            </button>
            <button onClick={() => copyMsg(vendorMessage(t))} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold ring-1 ring-inset" style={{ color: INK, borderColor: '#D5D9D9' }} title="Copy the vendor payment message">
              <Copy size={12} /> Copy vendor
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── POC operate / check-in view ────────────────────────────────────── */


/**
 * The operational update for a run.
 *
 * The client's rule: "if a trip contains a single VRID, allow one update only.
 * If a trip contains multiple VRIDs, allow separate updates for each VRID."
 * So every figure — Present/Absent, load type, manual/Amazon/GPS KM, expense,
 * invoice, POD, remarks, feedback and the photos — lives on the VRID, not the
 * tour (see TourLegOps). A single-VRID run renders exactly one block; a
 * multi-VRID run renders one collapsible block per VRID, each saved and
 * submitted on its own. The tour completes once every VRID has been submitted.
 *
 * Feedback and remarks are optional, per the client. KM, Amazon KM, GPS KM and
 * POD stay required — they're the figures the completion exists to capture.
 *
 * Mounted from Trips (the client moved updates out of the Amazon Tours board).
 */
export function TourOperate({ tour, onClose, onUpdate, showOwner }: {
  tour: Tour; onClose: () => void;
  onUpdate: (id: string, patch: Partial<Tour>, log?: { action: string; detail?: string; vrid?: string }) => void;
  showOwner: boolean;
}) {
  const { push } = useNotify();
  const legs = tour.legs ?? [];
  const multi = legs.length > 1;
  const allStops = legs.flatMap((l) => l.stops);
  const done = allStops.filter((s) => s.actualDeparture).length;
  const pct = allStops.length ? Math.round((done / allStops.length) * 100) : 0;
  const finished = allStops.length > 0 && done === allStops.length;
  // On a multi-VRID run only one block is expanded at a time, so a POC filling
  // in VRID 2 isn't scrolling past VRID 1's twenty fields to reach it.
  const [openLeg, setOpenLeg] = useState(0);

  const submittedCount = legs.filter((_, i) => legOps(tour, i).completedAtMs).length;
  const tourDone = tour.amzStatus === 'COMPLETED';

  function stampStop(li: number, si: number, key: 'actualArrival' | 'actualDeparture') {
    if (!tour.id) return;
    const next = legs.map((l, i) => (i !== li ? l : { ...l, stops: l.stops.map((s, j) => (j === si ? { ...s, [key]: Date.now() } : s)) }));
    const flat = next.flatMap((l) => l.stops);
    const anyIn = flat.some((s) => s.actualArrival);
    // Checking out of the last stop does NOT complete the run — completion is
    // only ever an explicit submit, so a run can't reach Completed with no KM.
    const status = tourDone ? 'COMPLETED' : anyIn ? 'IN PROGRESS' : 'PLANNED';
    const stop = legs[li]?.stops[si];
    onUpdate(tour.id, { legs: next, amzStatus: status, sarvaStatus: status }, {
      action: key === 'actualArrival' ? 'Checked in' : 'Checked out',
      vrid: legs[li]?.vrid ?? '',
      detail: `${stop?.name ?? 'Stop'} at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}`,
    });
  }

  function setLoadType(li: number, v: string) {
    if (!tour.id) return;
    onUpdate(tour.id, { legs: legs.map((l, i) => (i === li ? { ...l, loadType: v } : l)) }, {
      action: 'Load type set', vrid: legs[li]?.vrid ?? '', detail: v,
    });
  }

  function setStopFeedback(li: number, si: number, v: string) {
    if (!tour.id) return;
    // No audit line per keystroke — the VRID's Save records the final text.
    onUpdate(tour.id, { legs: legs.map((l, i) => (i !== li ? l : { ...l, stops: l.stops.map((s, j) => (j === si ? { ...s, feedback: v } : s)) })) });
  }

  /**
   * What actually changed on this VRID, as "Amazon KM 80 → 84" lines. The
   * export carries the full history rather than only the latest figures, so an
   * update has to say what it altered, not merely that it happened.
   */
  function diffOps(before: TourLegOps, after: TourLegOps): string {
    const fields: [keyof TourLegOps, string][] = [
      ['present', 'Present'], ['startKm', 'Start KM'], ['endKm', 'End KM'],
      ['totalManualKm', 'Manual KM'], ['amazonRelyKm', 'Amazon KM'], ['gpsKm', 'GPS KM'],
      ['podGiven', 'POD'], ['invoiceGiven', 'Invoice'],
      ['expenseAmount', 'Expense'], ['expenseNote', 'Expense note'],
      ['remarks', 'Remarks'], ['feedback', 'Feedback'],
    ];
    const show = (v: unknown) => (v === true ? 'Yes' : v === false ? 'No' : String(v ?? '').trim() || '—');
    const out = fields
      .filter(([k]) => show(before[k]) !== show(after[k]))
      .map(([k, label]) => `${label} ${show(before[k])} → ${show(after[k])}`);
    const photoCount = (o: TourLegOps) =>
      (o.kmPhotos?.length ?? 0) + (o.invoicePhotos?.length ?? 0) + (o.gpsPhotos?.length ?? 0) + (o.podPhotos?.length ?? 0);
    if (photoCount(before) !== photoCount(after)) out.push(`Photos ${photoCount(before)} → ${photoCount(after)}`);
    return out.join('; ');
  }

  /** Write one VRID's operational figures back onto its leg. */
  function writeOps(li: number, ops: TourLegOps, alsoComplete: boolean) {
    if (!tour.id) return;
    const merged: TourLegOps = alsoComplete ? { ...ops, completedAtMs: Date.now() } : ops;
    const nextLegs = legs.map((l, i) => (i === li ? { ...l, ops: merged } : l));
    const patch: Partial<Tour> = { legs: nextLegs };
    // Mirror leg 0 onto the tour-level fields so the legacy 54-column Amazon
    // sheet and the board's KM figures keep working unchanged.
    if (li === 0) {
      Object.assign(patch, {
        present: ops.present ?? tour.present,
        startKm: ops.startKm ?? '', endKm: ops.endKm ?? '',
        totalManualKm: ops.totalManualKm ?? '', amazonRelyKm: ops.amazonRelyKm ?? '',
        gpsKm: ops.gpsKm ?? '', remarks: ops.remarks ?? '', feedback: ops.feedback ?? '',
        podGiven: !!ops.podGiven, invoiceGiven: !!ops.invoiceGiven,
        expenseAmount: ops.expenseAmount ?? '', expenseNote: ops.expenseNote ?? '',
        podImg: ops.podPhotos?.[0] ?? '', kmPhotoImg: ops.kmPhotos?.[0] ?? '',
        invoicePhotoImg: ops.invoicePhotos?.[0] ?? '', gpsPhotoImg: ops.gpsPhotos?.[0] ?? '',
      });
    }
    // The run is complete only when every VRID on it has been submitted.
    if (alsoComplete) {
      const allIn = nextLegs.every((l, i) => (i === li ? true : !!legOps(tour, i).completedAtMs));
      if (allIn) { patch.amzStatus = 'COMPLETED'; patch.sarvaStatus = 'COMPLETED'; }
    }
    const vrid = legs[li]?.vrid ?? '';
    const changed = diffOps(legOps(tour, li), merged);
    onUpdate(tour.id, patch, {
      action: alsoComplete ? 'VRID submitted' : 'VRID updated',
      vrid,
      // A save with nothing altered still belongs in the trail — it records
      // that someone looked, which is what "not just the latest" is about.
      ...(changed ? { detail: changed } : {}),
    });
  }

  function onLegSubmit(li: number, ops: TourLegOps) {
    writeOps(li, ops, true);
    const remaining = legs.length - (submittedCount + 1);
    if (remaining > 0) {
      push({ title: `${legs[li]?.vrid ?? 'VRID'} submitted`, body: `${remaining} more VRID${remaining === 1 ? '' : 's'} to update on ${tour.tourId}.`, tone: 'success' });
      setOpenLeg(li + 1);
    } else {
      push({ title: 'Trip completed', body: `${tour.tourId} moved to Completed.`, tone: 'success' });
      onClose();
    }
  }

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
          {multi && (
            <p className="mt-2 text-center text-[11px] font-bold" style={{ color: submittedCount === legs.length ? '#067D62' : '#B15C00' }}>
              {submittedCount} of {legs.length} VRIDs updated — each one is submitted separately.
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {legs.map((leg, li) => (
            <LegUpdate
              key={`${leg.vrid}-${li}`}
              tour={tour} leg={leg} index={li} multi={multi}
              expanded={!multi || openLeg === li}
              onToggle={() => setOpenLeg(openLeg === li ? -1 : li)}
              allStops={allStops}
              onStamp={(si, key) => stampStop(li, si, key)}
              onStopFeedback={(si, v) => setStopFeedback(li, si, v)}
              onLoadType={(v) => setLoadType(li, v)}
              onSave={(ops) => writeOps(li, ops, false)}
              onSubmit={(ops) => onLegSubmit(li, ops)}
            />
          ))}
          {legs.length === 0 && <p className="py-8 text-center text-sm text-neutral-400">This route has no VRIDs to update.</p>}
        </div>

        {tourDone && (
          <div className="border-t border-neutral-100 px-5 py-3">
            <div className="flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-extrabold" style={{ background: '#EAF3EC', color: '#067D62' }}>
              <Flag size={15} /> Completed
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * One VRID's update: its stop timeline plus its own operational figures. Holds
 * the figures in local state so typing doesn't write to Firestore on every
 * keystroke — Save and Submit are what persist.
 */
function LegUpdate({ tour, leg, index, multi, expanded, onToggle, allStops, onStamp, onStopFeedback, onLoadType, onSave, onSubmit }: {
  tour: Tour; leg: TourLeg; index: number; multi: boolean;
  expanded: boolean; onToggle: () => void;
  allStops: TourLegStop[];
  onStamp: (si: number, key: 'actualArrival' | 'actualDeparture') => void;
  onStopFeedback: (si: number, v: string) => void;
  onLoadType: (v: string) => void;
  onSave: (ops: TourLegOps) => void;
  onSubmit: (ops: TourLegOps) => void;
}) {
  const stored = legOps(tour, index);
  const submitted = !!stored.completedAtMs;

  const [present, setPresent] = useState(stored.present || 'PRESENT');
  const [remarks, setRemarks] = useState(stored.remarks || '');
  const [startKm, setStartKm] = useState(stored.startKm || '');
  const [endKm, setEndKm] = useState(stored.endKm || '');
  const [amazonKm, setAmazonKm] = useState(stored.amazonRelyKm || '');
  const [gpsKm, setGpsKm] = useState(stored.gpsKm || '');
  const [expenseAmount, setExpenseAmount] = useState(stored.expenseAmount || '');
  const [expenseNote, setExpenseNote] = useState(stored.expenseNote || '');
  const [invoiceGiven, setInvoiceGiven] = useState(!!stored.invoiceGiven);
  const [podGiven, setPodGiven] = useState(!!stored.podGiven);
  const [feedback, setFeedback] = useState(stored.feedback || '');
  const [saved, setSaved] = useState(false);

  // Total KM is derived from the odometer, never typed.
  const kmSpan = (() => {
    const a = Number(startKm), b = Number(endKm);
    if (!startKm.trim() || !endKm.trim() || !Number.isFinite(a) || !Number.isFinite(b)) return null;
    return b - a;
  })();
  const totalKm = kmSpan === null ? (stored.totalManualKm || '') : String(kmSpan);
  const kmBackwards = kmSpan !== null && kmSpan < 0;

  function collect(): TourLegOps {
    return {
      present, remarks, startKm, endKm,
      totalManualKm: totalKm, amazonRelyKm: amazonKm, gpsKm,
      expenseAmount, expenseNote, invoiceGiven, podGiven, feedback,
      kmPhotos: stored.kmPhotos ?? [], invoicePhotos: stored.invoicePhotos ?? [],
      gpsPhotos: stored.gpsPhotos ?? [], podPhotos: stored.podPhotos ?? [],
      ...(stored.completedAtMs ? { completedAtMs: stored.completedAtMs } : {}),
    };
  }

  // Photos persist immediately — an upload has already left the device, and
  // losing it because the POC closed the sheet without pressing Save is the
  // failure mode this whole change is meant to end.
  const setPhotos = (key: 'kmPhotos' | 'invoicePhotos' | 'gpsPhotos' | 'podPhotos') => (urls: string[]) =>
    onSave({ ...collect(), [key]: urls });

  // What must be filled before this VRID can be submitted. Remarks and feedback
  // are deliberately NOT here — the client made them optional.
  const missing = [
    !startKm.trim() && 'starting KM',
    !endKm.trim() && 'ending KM',
    kmBackwards && 'valid KM readings',
    !amazonKm.trim() && 'Amazon KM',
    !gpsKm.trim() && 'GPS KM',
    !podGiven && 'POD (proof of delivery)',
  ].filter(Boolean) as string[];
  const canSubmit = missing.length === 0;

  const late = (s: TourLegStop) => s.actualArrival && s.arrivalAt && s.actualArrival > new Date(s.arrivalAt).getTime();
  const legDone = leg.stops.filter((s) => s.actualDeparture).length;
  const photoPath = `tours/${tour.id}/${leg.vrid || index}`;

  return (
    <div className={multi ? 'mb-3 overflow-hidden rounded-xl ring-1 ring-inset' : 'mb-3'} style={multi ? { borderColor: submitted ? '#BFE3CD' : '#D5D9D9' } : undefined}>
      {/* Header — on a multi-VRID run this is the accordion toggle */}
      {multi ? (
        <button type="button" onClick={onToggle}
          className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
          style={{ background: submitted ? '#F0F8F3' : '#F7F8F8' }}>
          <span className="rounded px-1.5 py-0.5 font-mono text-[11px] font-extrabold" style={{ background: '#EAF1F8', color: '#0F5C9E' }}>{leg.vrid}</span>
          <span className="text-[10px] font-bold uppercase text-neutral-400">{leg.loadType || 'Load'}</span>
          <span className="text-[11px] text-neutral-400">{legDone}/{leg.stops.length} stops</span>
          <span className="ml-auto flex items-center gap-2">
            {submitted
              ? <span className="inline-flex items-center gap-1 text-[11px] font-extrabold" style={{ color: '#067D62' }}><Check size={12} /> Updated</span>
              : <span className="text-[11px] font-bold" style={{ color: '#B15C00' }}>Needs update</span>}
            <ChevronRight size={15} className={`text-neutral-400 transition ${expanded ? 'rotate-90' : ''}`} />
          </span>
        </button>
      ) : (
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded px-1.5 py-0.5 font-mono text-[11px] font-extrabold" style={{ background: '#EAF1F8', color: '#0F5C9E' }}>{leg.vrid}</span>
          <span className="text-[10px] font-bold uppercase text-neutral-400">{leg.loadType || 'Load'}</span>
          {submitted && <span className="inline-flex items-center gap-1 text-[11px] font-extrabold" style={{ color: '#067D62' }}><Check size={12} /> Updated</span>}
        </div>
      )}

      {!expanded ? null : (
        <div className={multi ? 'px-3 py-3' : ''}>
          {/* Stop timeline with check-in / check-out */}
          <ol className="relative">
            {leg.stops.map((s, si) => {
              const inDone = !!s.actualArrival, outDone = !!s.actualDeparture;
              // Every stop is checked in and out on its own — the client runs
              // stops out of order, and a POC updating HKA3 late must not block
              // TBN8. So the buttons are gated only by THIS stop's own state.
              const { canCheckIn, canCheckOut } = stopControls(s);
              const globalIdx = allStops.indexOf(s);
              // The old sequential cursor is kept for the "Now" cue only, so one
              // stop still reads as the live one; it no longer gates any button.
              const frontier = !outDone && (globalIdx === 0 || !!allStops[globalIdx - 1]?.actualDeparture);
              return (
                <li key={si} className="relative flex gap-3 pb-4 last:pb-0">
                  {si < leg.stops.length - 1 && <span className="absolute left-[13px] top-6 h-full w-0.5" style={{ background: outDone ? '#067D62' : '#D5D9D9' }} />}
                  <span className="z-10 flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded-full text-white ring-4 ring-white" style={{ background: outDone ? '#067D62' : inDone ? ORANGE : frontier ? INK : '#c3c9cf' }}>
                    {outDone ? <Check size={15} /> : <span className="font-mono text-[11px] font-black">{si + 1}</span>}
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-bold" style={{ color: INK }}>
                      <span className="font-mono">{s.name}</span>
                      {frontier && !inDone && <span className="rounded-full px-2 py-0.5 text-[10px] font-extrabold" style={{ background: '#FFF3E0', color: '#B15C00' }}>Now</span>}
                      {inDone && !outDone && <span className="rounded-full px-2 py-0.5 text-[10px] font-extrabold" style={{ background: '#FFF3E0', color: '#B15C00' }}>In progress</span>}
                      {late(s) && <span className="rounded-full px-2 py-0.5 text-[10px] font-extrabold" style={{ background: '#FCE9EC', color: '#B12704' }}>Late</span>}
                      {s.mapUrl && <a href={s.mapUrl} target="_blank" rel="noreferrer" className="text-[11px] font-bold" style={{ color: '#007185' }}>Map</a>}
                    </div>
                    <div className="mt-1 grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <div className="text-neutral-400">Arrival · plan {fmtDTShort(s.arrivalAt)}</div>
                        {/* `?? 0` is unreachable — canCheckIn is false only once
                            actualArrival is stamped; it just satisfies the type. */}
                        {!canCheckIn ? <div className="font-bold" style={{ color: '#067D62' }}>✓ In {fmtClock(s.actualArrival ?? 0)}</div>
                          : <button onClick={() => onStamp(si, 'actualArrival')} className="mt-0.5 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-white" style={{ background: INK }}><LogIn size={11} /> Check in</button>}
                      </div>
                      <div>
                        <div className="text-neutral-400">Departure · plan {fmtDTShort(s.departureAt)}</div>
                        {s.actualDeparture ? <div className="font-bold" style={{ color: '#067D62' }}>✓ Out {fmtClock(s.actualDeparture)}</div>
                          : canCheckOut ? <button onClick={() => onStamp(si, 'actualDeparture')} className="mt-0.5 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold" style={{ background: ORANGE, color: INK }}><LogOut size={11} /> Check out</button>
                            : <div className="text-neutral-300">—</div>}
                      </div>
                    </div>
                    {inDone && (
                      <input value={s.feedback ?? ''} onChange={(e) => onStopFeedback(si, e.target.value)}
                        placeholder="Feedback for this stop…"
                        className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-2 py-1 text-[11px] outline-none focus:border-primary-400" />
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          {/* This VRID's operational figures */}
          <div className="mt-3 rounded-xl p-3 ring-1 ring-inset" style={{ background: '#F7F8F8', borderColor: '#D5D9D9' }}>
            <div className="mb-2 text-xs font-extrabold" style={{ color: INK }}>
              {multi ? `Update ${leg.vrid}` : 'Open and update'}
            </div>

            <Field label="Present / Absent">
              <div className="grid grid-cols-2 gap-2">
                {['PRESENT', 'ABSENT'].map((m) => (
                  <button key={m} type="button" onClick={() => setPresent(m)} className="rounded-lg px-3 py-2 text-xs font-bold ring-1 ring-inset"
                    style={present === m ? { background: m === 'ABSENT' ? '#B12704' : INK, color: '#fff', borderColor: 'transparent' } : { background: '#fff', color: '#5A6572', borderColor: '#D5D9D9' }}>{m}</button>
                ))}
              </div>
            </Field>

            <div className="mt-2">
              <Field label="Load type">
                <div className="grid grid-cols-2 gap-2">
                  {['Load', 'No Load'].map((m) => (
                    <button key={m} type="button" onClick={() => onLoadType(m)} className="rounded-lg px-2 py-2 text-xs font-bold ring-1 ring-inset"
                      style={(leg.loadType || 'Load') === m ? { background: INK, color: '#fff', borderColor: INK } : { background: '#fff', color: '#5A6572', borderColor: '#D5D9D9' }}>{m}</button>
                  ))}
                </div>
              </Field>
            </div>

            <div className="mt-2 grid grid-cols-3 gap-2">
              <Field label="Starting KM"><TextInput inputMode="numeric" value={startKm} onChange={(e) => setStartKm(e.target.value)} placeholder="12500" /></Field>
              <Field label="Ending KM"><TextInput inputMode="numeric" value={endKm} onChange={(e) => setEndKm(e.target.value)} placeholder="12582" /></Field>
              <Field label="Manual KM" hint="auto"><TextInput value={totalKm} disabled placeholder="—" /></Field>
            </div>
            {kmBackwards && <p className="mt-1 text-[11px] font-bold" style={{ color: '#B12704' }}>Ending KM is lower than starting KM — check the readings.</p>}

            <div className="mt-2 grid grid-cols-2 gap-2">
              <Field label="Amazon KM"><TextInput inputMode="numeric" value={amazonKm} onChange={(e) => setAmazonKm(e.target.value)} placeholder="80" /></Field>
              <Field label="Vehicle GPS KM"><TextInput inputMode="numeric" value={gpsKm} onChange={(e) => setGpsKm(e.target.value)} placeholder="84" /></Field>
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
            {/* Optional, per the client — a run completes without them. */}
            <div className="mt-2"><Field label="Remarks" hint="Optional"><TextInput value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="On schedule / checkpost delay…" /></Field></div>
            <div className="mt-2"><Field label="Feedback" hint="Optional — how did the run go?"><TextInput value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Any feedback on this run…" /></Field></div>
            <div className="mt-2">
              <Field label="POD — proof of delivery" required>
                <div className="grid grid-cols-2 gap-2">
                  {[['Received', true], ['Pending', false]].map(([lbl, val]) => (
                    <button key={String(lbl)} type="button" onClick={() => setPodGiven(val as boolean)} className="rounded-lg px-2 py-2 text-xs font-bold ring-1 ring-inset"
                      style={podGiven === val ? { background: val ? '#067D62' : '#B12704', color: '#fff', borderColor: 'transparent' } : { background: '#fff', color: '#5A6572', borderColor: '#D5D9D9' }}>{lbl as string}</button>
                  ))}
                </div>
              </Field>
            </div>

            {/* Photos — several per kind, saved the moment they upload. */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <MultiImageUpload label="KM photos" value={stored.kmPhotos} onChange={setPhotos('kmPhotos')} path={`${photoPath}/km`} />
              <MultiImageUpload label="Invoice photos" value={stored.invoicePhotos} onChange={setPhotos('invoicePhotos')} path={`${photoPath}/invoice`} />
              <MultiImageUpload label="GPS photos" value={stored.gpsPhotos} onChange={setPhotos('gpsPhotos')} path={`${photoPath}/gps`} />
              <MultiImageUpload label="POD photos" value={stored.podPhotos} onChange={setPhotos('podPhotos')} path={`${photoPath}/pod`} />
            </div>
          </div>

          {/* Save / submit — per VRID */}
          {submitted ? (
            <div className="mt-3 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-extrabold" style={{ background: '#EAF3EC', color: '#067D62' }}>
              <Flag size={14} /> {leg.vrid} updated
            </div>
          ) : (
            <>
              {!canSubmit && (
                <p className="mt-2 text-center text-[11px] font-semibold" style={{ color: '#B15C00' }}>
                  Still needed: {missing.join(' · ')}.
                </p>
              )}
              <div className="mt-2 flex items-center gap-2">
                <button onClick={() => { onSave(collect()); setSaved(true); setTimeout(() => setSaved(false), 1500); }}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold ring-1 ring-inset" style={{ color: INK, borderColor: '#D5D9D9', background: '#fff' }}>
                  {saved ? <><Check size={15} /> Saved</> : <><Save size={15} /> Save</>}
                </button>
                <button onClick={() => onSubmit(collect())} disabled={!canSubmit}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-extrabold disabled:opacity-40"
                  style={{ background: ORANGE, color: INK }}>
                  <Flag size={15} /> {multi ? `Submit ${leg.vrid}` : 'Submit & complete'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
