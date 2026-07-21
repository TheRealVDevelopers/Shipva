import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus, FileText, MapPin, Search, Truck, X, Check, ExternalLink, Flag, Navigation,
  Trash2, Route as RouteIcon, UserPlus, UserCog, ChevronRight, Pencil, Download, CalendarRange,
  AlertTriangle,
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
import { isVerified, type Trip, type TripPoint } from '../../lib/mocks.js';
import { useStore, stageOf, dieselRequestFor, requestStatusLabel, type Customer, type DelayReport, type Tour } from '../../lib/store.js';
import { buildBoard, inLane, matches, sortForLane, isOverdue, type BoardItem, type Lane } from '../../lib/board.js';
import { ReportDelay } from '../../components/ReportDelay.js';
import { TourOperate } from './Tours.js';
import { useAuth } from '../../lib/auth.js';
import { watchMembers, teamOf, type Member } from '../../lib/members.js';
import { canEditRecords } from '../../lib/roles.js';
import { useNotify } from '../../lib/notify.js';
import { printLR } from '../../lib/print.js';
import { exportRows, rupeeCell, type Cell } from '../../lib/exportExcel.js';
import { tripSteps, tripPoints, currentStep, progressPct } from '../../lib/trip.js';

// Three tabs, no "All" — the client's call. Amazon tours and ordinary trips
// share these lanes (see lib/board).
const FILTERS: Lane[] = ['Upcoming', 'In Transit', 'Completed'];
type Filter = Lane;

interface PointDraft { label: string; mapUrl: string }
const blankPoint = (): PointDraft => ({ label: '', mapUrl: '' });
const EMPTY = {
  mode: 'single' as 'single' | 'multi',
  date: '', driver: '', vehicleReg: '', customer: '', material: '', weight: '', freight: '', handledBy: '',
};
const NEW_DRIVER = { name: '', phone: '', vehicleReg: '', aadhaar: '', licenseNo: '' };

const LANE_TONE: Record<Lane, BadgeTone> = { Upcoming: 'info', 'In Transit': 'primary', Completed: 'success' };

const fmtPlan = (dt?: string) => {
  if (!dt) return '—';
  const d = new Date(dt);
  return isNaN(d.getTime()) ? dt : d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
};
const fmtActual = (ms?: number) => (ms ? new Date(ms).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }) : '');

/**
 * One run on the board. Collapsed it's a scannable line; expanded it shows the
 * Relay-style Stop / Equipment / Arrival / Departure breakdown, per VRID.
 *
 * Trip-only actions (LR, track, status) are hidden for tours — a tour is worked
 * from its own line board, and pretending otherwise would offer buttons that do
 * nothing.
 */
function BoardRow({ item, expanded, onToggle, showOwner, canEdit, canAssign, onReport, onTrack, onPrintLR, onEdit, onDelete, onAdvance, onUpdate, onReassign }: {
  item: BoardItem; expanded: boolean; onToggle: () => void; showOwner: boolean; canEdit: boolean; canAssign: boolean;
  onReport: () => void; onTrack: () => void; onPrintLR: () => void;
  onEdit: () => void; onDelete: () => void; onAdvance: () => void; onUpdate: () => void; onReassign: () => void;
}) {
  const isTour = item.kind === 'tour';
  const trip = isTour ? null : (item.source as Trip);
  const steps = trip ? tripSteps(trip) : [];
  const cur = trip ? currentStep(trip) : 0;
  const next = trip ? steps[cur + 1] : undefined;
  const finished = trip ? cur >= steps.length - 1 : item.lane === 'Completed';
  const reports = item.source.reports ?? [];
  const overdue = isOverdue(item);

  return (
    <div className={`${overdue ? 'border-l-2 border-rose-400 bg-rose-50/30' : ''} ${expanded ? 'bg-primary-50/20' : ''}`}>
      {/* Collapsed line */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3 hover:bg-neutral-50/70">
        <button onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-2 text-left" aria-expanded={expanded}>
          <ChevronRight size={14} className={`shrink-0 text-neutral-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          <span className="font-mono text-sm font-extrabold text-primary-700">{item.code}</span>
          <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase ${isTour ? 'bg-amber-100 text-amber-800' : 'bg-neutral-100 text-neutral-600'}`}>
            {isTour ? 'Amazon' : 'Trip'}
          </span>
          <span className="truncate text-xs text-neutral-500">
            {item.stops.map((s) => s.name).join(' → ') || '—'}
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-2 text-[11px] text-neutral-500">
          {item.distanceLabel && <span className="font-semibold text-neutral-700">{item.distanceLabel}</span>}
          {item.vehicleType && <span>{item.vehicleType}</span>}
          <span className="font-mono">{item.vehicle || '—'}</span>
          {/* Overdue on its next scheduled update — the client's "mark as pending". */}
          {overdue
            ? <span title={item.nextUpdateMs ? `Update was due ${fmtActual(item.nextUpdateMs)}` : 'Update overdue'}><Badge tone="danger"><AlertTriangle size={10} /> Pending</Badge></span>
            : <Badge tone={LANE_TONE[item.lane]}>{item.lane}</Badge>}
          {item.lane === 'In Transit' && item.lastUpdatedMs && (
            <span className="text-neutral-400" title="Last updated">upd {fmtActual(item.lastUpdatedMs)}</span>
          )}
          {reports.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 font-bold text-amber-700" title={`${reports.length} delay report${reports.length === 1 ? '' : 's'}`}>
              <AlertTriangle size={10} /> {reports.length}
            </span>
          )}
          {showOwner && item.ownerName && (
            <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-0.5 font-bold text-neutral-600" title="Handled by">
              <UserCog size={10} /> {item.ownerName}
            </span>
          )}
        </div>
      </div>

      {/* Expanded — Stop / Equipment / Arrival / Departure, per VRID */}
      {expanded && (
        <div className="px-4 pb-4">
          {item.legs.map((leg) => (
            <div key={leg.vrid} className="mb-3 overflow-hidden rounded-lg ring-1 ring-inset ring-neutral-200">
              <div className="flex items-center gap-2 bg-neutral-50 px-3 py-1.5">
                <span className="rounded bg-primary-50 px-1.5 py-0.5 font-mono text-[11px] font-extrabold text-primary-700">{leg.vrid}</span>
                {leg.loadType && <span className="text-[10px] font-bold uppercase text-neutral-500">{leg.loadType}</span>}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] uppercase tracking-wide text-neutral-400">
                    <tr>
                      <th className="px-3 py-1.5 font-semibold">Stop</th>
                      <th className="px-3 py-1.5 font-semibold">Equipment</th>
                      <th className="px-3 py-1.5 font-semibold">Arrival</th>
                      <th className="px-3 py-1.5 font-semibold">Departure</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {leg.stops.map((s, si) => (
                      <tr key={si}>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-neutral-200 text-[9px] font-black text-neutral-600">{si + 1}</span>
                            <span className="font-mono font-bold text-neutral-800">{s.name}</span>
                            {s.mapUrl && <a href={s.mapUrl} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-primary-600 hover:underline">Map</a>}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-neutral-600">{item.vehicleType || '—'}<div className="text-[10px] text-neutral-400">{item.vehicle}</div></td>
                        <td className="px-3 py-2">
                          <div className="text-neutral-400">Sch. {fmtPlan(s.arrivalAt)}</div>
                          {s.actualArrival ? <div className="font-bold text-emerald-600">✓ {fmtActual(s.actualArrival)}</div> : null}
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-neutral-400">Sch. {fmtPlan(s.departureAt)}</div>
                          {s.actualDeparture ? <div className="font-bold text-emerald-600">✓ {fmtActual(s.actualDeparture)}</div> : null}
                        </td>
                      </tr>
                    ))}
                    {leg.stops.length === 0 && (
                      <tr><td colSpan={4} className="px-3 py-3 text-center text-[11px] text-neutral-400">No stops recorded.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-[11px] text-neutral-500">
              {item.driver || '—'}{item.driverNumber ? ` · ${item.driverNumber}` : ''} · {item.dateLabel}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Was "Report delay" — the client wants it to read simply "Report". */}
              <button onClick={onReport} className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-amber-700 ring-1 ring-inset ring-amber-200 hover:bg-amber-50">
                <AlertTriangle size={12} /> Report
              </button>
              {/* Amazon tours are updated here now, not on the Amazon Tours board:
                  present/absent, load, KM, photos, and submit-to-complete. */}
              {isTour && (
                <button onClick={onUpdate} className="inline-flex items-center gap-1 rounded-lg bg-primary-500 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-primary-600">
                  <Navigation size={12} /> Update
                </button>
              )}
              {!isTour && (
                <>
                  {!finished && next && (
                    <button onClick={onAdvance} className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-600">
                      <Check size={12} /> {cur === steps.length - 2 ? 'Finish' : next.label}
                    </button>
                  )}
                  <button onClick={onTrack} className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-primary-600 ring-1 ring-inset ring-primary-200 hover:bg-primary-50"><Navigation size={12} /> Track</button>
                  <button onClick={onPrintLR} className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-neutral-600 ring-1 ring-inset ring-neutral-200 hover:bg-neutral-50"><FileText size={12} /> LR</button>
                </>
              )}
              {/* Reassign — leadership can hand this run to a different employee. */}
              {canAssign && (
                <button onClick={onReassign} className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold text-neutral-600 ring-1 ring-inset ring-neutral-200 hover:bg-neutral-50" title="Reassign to another employee">
                  <UserCog size={12} /> {item.ownerName ? 'Reassign' : 'Assign'}
                </button>
              )}
              {canEdit && (
                <>
                  <button onClick={onEdit} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-primary-600" title={isTour ? 'Edit on the Amazon Tours board' : 'Edit trip'}><Pencil size={14} /></button>
                  {!isTour && <button onClick={onDelete} className="rounded-lg p-1.5 text-neutral-400 hover:bg-amber-50 hover:text-amber-600" title="Cancel / archive trip"><Trash2 size={14} /></button>}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Trips() {
  const { trips, tours, drivers, trucks, customers, requests, savedPoints, addTrip, addSavedPoint, addDriver, advanceTrip, updateTrip, archiveTrip, updateTour } = useStore();
  const { member } = useAuth();
  const isAdmin = member?.role === 'owner' || member?.role === 'manager';
  const canAssign = isAdmin || member?.role === 'team_leader';
  const canEdit = canEditRecords(member?.role);
  const { push } = useNotify();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [members, setMembers] = useState<Member[]>([]);
  const initialFilter = FILTERS.find((x) => x === params.get('f')) ?? 'Upcoming';
  const [filter, setFilter] = useState<Filter>(initialFilter);
  /** Which row is expanded into its Stop / Equipment / Arrival / Departure detail. */
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [reportFor, setReportFor] = useState<BoardItem | null>(null);
  // The operational update for an Amazon tour now lives here in Trips. Hold the
  // id and look the live record up, so a save re-renders instead of freezing.
  const [operateId, setOperateId] = useState<string | null>(null);
  const operating = operateId ? tours.find((t) => t.id === operateId) ?? null : null;
  const [reassignFor, setReassignFor] = useState<BoardItem | null>(null);
  const [reassignTo, setReassignTo] = useState('');
  const [mineOnly, setMineOnly] = useState(false);
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

  // Amazon tours and ordinary trips on one board. Both collections are already
  // scoped per member upstream, so whatever a POC can see here is already theirs.
  const board = useMemo(() => buildBoard(tours, trips), [tours, trips]);

  // Completed date window — "which runs finished between these dates". Uses the
  // run's own timestamp, not its display label, which has no year on old rows.
  const inDateWindow = (i: BoardItem): boolean => {
    if (filter !== 'Completed' || (!from && !to)) return true;
    if (!i.startMs) return false;
    if (from && i.startMs < new Date(`${from}T00:00:00`).getTime()) return false;
    if (to && i.startMs > new Date(`${to}T23:59:59`).getTime()) return false;
    return true;
  };

  // Sorted by lane, per the client: Upcoming earliest-first by schedule, In
  // Transit with overdue ("pending") pinned to the top, Completed newest-first.
  const shown = sortForLane(
    board
      .filter((i) => inLane(i, filter)).filter(inDateWindow).filter((i) => matches(i, q))
      // "Assigned to me" — narrow to the runs this member owns.
      .filter((i) => !mineOnly || i.ownerUid === member?.uid),
    filter,
  );

  /** Hand a run to a different employee (leadership only). */
  function reassign(i: BoardItem, uid: string) {
    const m = members.find((x) => x.uid === uid);
    if (!m) return;
    const patch = { ownerUid: m.uid, ownerName: m.name, leaderUid: teamOf(m) };
    if (i.kind === 'tour') updateTour(i.id, patch); else updateTrip(i.id, patch);
    push({ title: 'Reassigned', body: `${i.code} handed to ${m.name}.`, tone: 'success' });
  }

  /** Export exactly what's on screen — the tab, dates and search applied. The
   *  full column set the client listed on page 2: trip ID, client, vehicle,
   *  driver, routes, load, arrival/departure, VR IDs, ETAs, revised ETAs, delay +
   *  reason codes, diesel request, source/dest KM, POD, remarks, feedback,
   *  status and last-updated. (No trip sample sheet was supplied, so the order is
   *  this list; layout will be matched once a sample arrives.) */
  function exportShown() {
    const fmtTs = (ms?: number) => (ms ? new Date(ms).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }) : '');
    const stopTimes = (i: BoardItem, key: 'arrivalAt' | 'departureAt') => i.stops.map((s) => s[key] || '').filter(Boolean).map(fmtPlan).join(' · ');
    exportRows(`sarva-trips-${filter.toLowerCase().replace(/\s+/g, '-')}`,
      ['Type', 'Trip ID', 'Client / Vendor', 'Vehicle', 'Vehicle type', 'Driver', 'Driver no',
        'Route', 'Load', 'Scheduled arrivals', 'Scheduled departures', 'VR IDs',
        'ETA', 'Revised ETA', 'Delay reason(s)', 'Diesel request', 'Source→Dest KM',
        'POD', 'Remarks', 'Feedback', 'Status', 'Last updated'],
      shown.map((i): Cell[] => {
        const t = i.kind === 'tour' ? (i.source as Tour) : null;
        const trip = i.kind === 'trip' ? (i.source as Trip) : null;
        const reps = i.source.reports ?? [];
        const diesel = t ? dieselRequestFor(requests, t.id) : undefined;
        const km = t ? [t.startKm, t.endKm].filter(Boolean).join('→') : '';
        return [
          i.kind === 'tour' ? 'Amazon tour' : 'Trip',
          i.code,
          t ? (t.vendorName ?? '') : (trip?.customer ?? ''),
          i.vehicle, i.vehicleType, i.driver, i.driverNumber,
          i.stops.map((s) => s.name).join(' → '),
          i.legs.map((l) => l.loadType).filter(Boolean).join(', '),
          stopTimes(i, 'arrivalAt'), stopTimes(i, 'departureAt'),
          i.vrids.join(', '),
          i.nextUpdateMs ? fmtActual(i.nextUpdateMs) : '',
          reps.map((r) => r.estimatedAt).filter(Boolean).join(' · '),
          reps.map((r) => `${r.event}: ${r.reason}`).join(' · '),
          diesel ? requestStatusLabel(diesel) : '',
          km || i.distanceLabel,
          t?.podGiven ? 'Received' : '',
          [t?.remarks, trip?.remark].filter(Boolean).join(' · '),
          t?.feedback ?? '',
          i.lane,
          fmtTs(i.lastUpdatedMs),
        ];
      }));
    push({ title: 'Exported', body: `${shown.length} run${shown.length === 1 ? '' : 's'} downloaded.`, tone: 'success' });
  }

  /** Save a delay report back to whichever kind of record it came from. */
  function saveReports(i: BoardItem, reports: DelayReport[], startTransit: boolean) {
    if (i.kind === 'tour') {
      // Submitting a report on an Upcoming tour moves it to In Transit.
      updateTour(i.id, startTransit ? { reports, amzStatus: 'IN PROGRESS', sarvaStatus: 'IN PROGRESS' } : { reports });
    } else {
      updateTrip(i.id, startTransit ? { reports, status: 'in_transit' } : { reports });
    }
  }
  const active = trips.filter((t) => t.status !== 'closed').length;
  const freightTotal = trips.reduce((s, t) => s + t.freightPaise, 0);
  // Real month-to-date count — this used to be a hardcoded demo number.
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
  const tripsMtd = trips.filter((t) => (t.createdAtMs ?? 0) >= monthStart).length;
  const tracked = trackId ? trips.find((t) => t.id === trackId) ?? null : null;

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  function resetForm() {
    // handledBy starts blank so leadership must choose an assignee (see errs).
    setF({ ...EMPTY, date: todayFullLabel() });
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
    archiveTrip(confirmDel.id);
    push({ title: 'Trip cancelled', body: `${confirmDel.lr} archived — kept for the record.`, tone: 'info' });
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
    // Leadership must consciously assign the trip to an employee (the client's
    // "you can't save without choosing who it's assigned to").
    handledBy: canAssign ? requiredError(f.handledBy, 'Assignee') : '',
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
              {/* "Assigned to me" — narrow the board to this member's own runs. */}
              <button onClick={() => setMineOnly((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ring-1 ring-inset transition ${mineOnly ? 'bg-primary-500 text-white ring-primary-500' : 'bg-neutral-50 text-neutral-600 ring-neutral-200 hover:bg-neutral-100'}`}
                title="Show only trips and tours assigned to me">
                <UserCog size={13} /> Assigned to me
              </button>
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

          {/* One board: Amazon tours and ordinary trips, newest first. */}
          <div className="divide-y divide-neutral-100">
            {shown.map((i) => (
              <BoardRow key={`${i.kind}-${i.id || i.code}`} item={i}
                expanded={openRow === `${i.kind}-${i.id}`}
                onToggle={() => setOpenRow(openRow === `${i.kind}-${i.id}` ? null : `${i.kind}-${i.id}`)}
                showOwner={isAdmin || canAssign}
                canEdit={canEdit}
                canAssign={canAssign}
                onReport={() => setReportFor(i)}
                onTrack={() => i.kind === 'trip' && i.id && setTrackId(i.id)}
                onPrintLR={() => i.kind === 'trip' && printLR(i.source as Trip)}
                onEdit={() => i.kind === 'trip' ? startEdit(i.source as Trip) : navigate('/p/tours')}
                onDelete={() => i.kind === 'trip' && setConfirmDel(i.source as Trip)}
                onAdvance={() => i.kind === 'trip' && advanceOnCard(i.source as Trip)}
                onUpdate={() => i.kind === 'tour' && i.id && setOperateId(i.id)}
                onReassign={() => { setReassignTo(i.ownerUid || ''); setReassignFor(i); }}
              />
            ))}
            {shown.length === 0 && (
              <div className="py-10 text-center text-sm text-neutral-400">
                {board.length === 0
                  ? 'Nothing here yet — create a trip, or assign an Amazon route.'
                  : `No ${filter.toLowerCase()} runs match this view.`}
              </div>
            )}
          </div>
        </Card>
      </div>

      <datalist id="saved-points">
        {savedPoints.map((sp) => <option key={sp.label} value={sp.label} />)}
      </datalist>

      {/* Report a delay against a VRID's arrival/departure */}
      {operating && (
        <TourOperate tour={operating} onClose={() => setOperateId(null)} onUpdate={updateTour} showOwner={isAdmin || canAssign} />
      )}

      {reportFor && (
        <ReportDelay item={reportFor} onClose={() => setReportFor(null)}
          onSave={(reports, startTransit) => saveReports(reportFor, reports, startTransit)} />
      )}

      {/* Reassign a trip or tour to a different employee */}
      {reassignFor && (
        <Modal open onClose={() => setReassignFor(null)}
          title={`Assign ${reassignFor.code}`} subtitle={reassignFor.ownerName ? `Currently ${reassignFor.ownerName}` : 'Not assigned yet'}
          onSubmit={() => { reassign(reassignFor, reassignTo); setReassignFor(null); }}
          submitLabel="Assign" submitDisabled={!reassignTo}>
          <Field label="Assign to" required hint="Only this employee sees and updates the run">
            <Select value={reassignTo} onChange={(e) => setReassignTo(e.target.value)}>
              <option value="">— Assign to an employee —</option>
              {assignable.map((m) => <option key={m.uid} value={m.uid}>{m.name}{m.uid === member?.uid ? ' (me)' : ''}</option>)}
            </Select>
          </Field>
        </Modal>
      )}

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
          <Field label="Assign to" required hint={isAdmin ? 'The employee who owns and updates this trip' : 'Which of your POCs runs this trip'} error={tried ? errs.handledBy : undefined}>
            <Select value={f.handledBy} onChange={set('handledBy')}>
              <option value="">— Assign to an employee —</option>
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

      {/* Cancel / archive trip — never a hard delete (the client's rule). */}
      {confirmDel && (
        <Modal open onClose={() => setConfirmDel(null)} title={`Cancel ${confirmDel.lr}?`} subtitle="Archived, not deleted"
          onSubmit={doDelete} submitLabel="Cancel trip">
          <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800 ring-1 ring-inset ring-amber-100">
            <b>{confirmDel.lr}</b> ({confirmDel.from} → {confirmDel.to}, {confirmDel.driver}) will be <b>archived and removed from the board</b> for the whole team.
            {confirmDel.status !== 'closed' && <> This trip is still <b>in progress</b>.</>} The record is kept — nothing is permanently deleted — and any invoice raised against it stays.
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
