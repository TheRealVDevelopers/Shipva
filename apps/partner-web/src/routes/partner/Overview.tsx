import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  IndianRupee, TrendingUp, Wallet, Navigation, Fuel, AlertTriangle, ArrowRight,
  Users, Truck as TruckIcon, FileText, Plus, Gauge as GaugeIcon,
  Clock, Timer, Route as RouteIcon, CheckCircle2, Wrench, Circle,
} from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card, CardHeader, CardBody } from '../../components/ui/Card.js';
import { StatCard } from '../../components/ui/StatCard.js';
import { Badge, type BadgeTone } from '../../components/ui/Badge.js';
import { BarPairChart, Donut, RadialGauge } from '../../components/ui/Charts.js';
import { VehicleArt } from '../../components/art.js';
import { MyDayStrip } from '../../components/MyDay.js';
import { TeamMix } from '../../components/TeamMix.js';
import { useAuth } from '../../lib/auth.js';
import { rupees } from '../../lib/format.js';
import { type TripStatus } from '../../lib/mocks.js';
import { useStore } from '../../lib/store.js';
import { buildBoard, inLane, isOverdue, type Lane } from '../../lib/board.js';
import { watchAllToday, presence, type Activity } from '../../lib/activity.js';
import { BRAND } from '../../lib/brand.js';

/** No update seen in this long, on an In-Transit run, is worth a nudge. */
const STALE_UPDATE_MS = 30 * 60 * 1000;

const TRIP_BADGE: Record<TripStatus, { label: string; tone: BadgeTone }> = {
  assigned: { label: 'Assigned', tone: 'info' },
  loading: { label: 'Loading', tone: 'accent' },
  in_transit: { label: 'In transit', tone: 'primary' },
  at_drop: { label: 'At drop', tone: 'primary' },
  pod_pending: { label: 'POD pending', tone: 'warning' },
  closed: { label: 'Closed', tone: 'success' },
};

const STATUS_ORDER: { st: TripStatus; label: string; color: string }[] = [
  { st: 'assigned', label: 'Scheduled', color: '#0ea5e9' },
  { st: 'loading', label: 'Loading', color: 'var(--sx-accent-500)' },
  { st: 'in_transit', label: 'In transit', color: 'var(--sx-primary-500)' },
  { st: 'at_drop', label: 'At drop', color: 'var(--sx-primary-300)' },
  { st: 'pod_pending', label: 'POD pending', color: '#f59e0b' },
  { st: 'closed', label: 'Completed', color: '#10b981' },
];

function QuickAction({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-bold text-neutral-700 ring-1 ring-inset ring-neutral-200 transition hover:-translate-y-0.5 hover:text-primary-700 hover:ring-primary-200">
      {icon} {label}
    </Link>
  );
}

export function Overview() {
  const { trips, tours, trucks, invoices, expenses, fuelLogs, payroll, drivers } = useStore();
  const { member } = useAuth();
  // "Trips by status" was counting ordinary trips only, so an operation that
  // runs on Amazon tours saw 0 / 0 / 0. Count both, through the shared board
  // lanes, the same way the Trips page groups them.
  const board = buildBoard(tours, trips);
  const laneCount = (lane: Lane) => board.filter((i) => inLane(i, lane)).length;
  const tourLaneCount = (lane: Lane) => board.filter((i) => i.kind === 'tour' && inLane(i, lane)).length;
  // Three dashboards, by role: an admin (owner/manager) sees everything incl.
  // money; a team leader sees the ops pulse + their team but not company money;
  // an ordinary employee (supervisor) gets the lightweight view — their day and
  // operational counts, no revenue or vendor money. The accountant keeps money.
  const isAdmin = member?.role === 'owner' || member?.role === 'manager';
  const isLead = isAdmin || member?.role === 'team_leader';
  const seesMoney = isAdmin || member?.role === 'accountant';
  const inr = (n: number) => rupees(n);

  // Live presence, for the "active now / on break" pulse (leads only render it).
  const [activity, setActivity] = useState<Activity[]>([]);
  useEffect(() => { if (isLead) return watchAllToday(setActivity); }, [isLead]);

  const onTrip = trucks.filter((t) => t.status === 'on_trip').length;
  const available = trucks.filter((t) => t.status === 'available').length;
  const maintenance = trucks.filter((t) => t.status === 'maintenance').length;
  const utilization = trucks.length ? Math.round((onTrip / trucks.length) * 100) : 0;

  const revenue = trips.reduce((s, t) => s + t.freightPaise, 0);
  const expenseTotal = expenses.reduce((s, e) => s + e.amountPaise, 0)
    + fuelLogs.reduce((s, f) => s + f.costPaise, 0)
    + payroll.reduce((s, p) => s + p.netPaise, 0);
  const profit = revenue - expenseTotal;
  const marginPct = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
  const outstanding = invoices.filter((i) => i.status !== 'paid').reduce((s, i) => s + i.totalPaise, 0);
  const collected = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.totalPaise, 0);
  const activeTrips = board.filter((i) => !inLane(i, 'Completed')).length;
  const fuelActual = fuelLogs.reduce((s, f) => s + f.costPaise, 0);
  const fuelExpected = fuelLogs.reduce((s, f) => s + f.expectedPaise, 0);
  const fuelLeak = Math.max(0, fuelActual - fuelExpected);
  const collectPct = (collected + outstanding) > 0 ? Math.round((collected / (collected + outstanding)) * 100) : 0;

  // The six-state breakdown is trip-specific; tours have no such states, so fold
  // each tour into the representative bucket for its lane. That keeps the bar and
  // legend populated for a tour-only operation instead of showing an empty strip.
  const statusCount = (st: TripStatus) => {
    const t = trips.filter((x) => x.status === st).length;
    if (st === 'assigned') return t + tourLaneCount('Upcoming');
    if (st === 'in_transit') return t + tourLaneCount('In Transit');
    if (st === 'closed') return t + tourLaneCount('Completed');
    return t;
  };
  // The three headline cards are the client's "Trips by status" — count by lane
  // so they match the Trips page exactly.
  const scheduled = laneCount('Upcoming');
  const ongoing = laneCount('In Transit');
  const completed = laneCount('Completed');

  const payrollTotal = payroll.reduce((s, p) => s + p.netPaise, 0);
  const catTotal = (labels: string[]) => expenses.filter((e) => labels.includes(e.category)).reduce((s, e) => s + e.amountPaise, 0);
  const expenseSegments = [
    { label: 'Fuel', value: fuelActual, color: 'var(--sx-accent-500)' },
    { label: 'Salaries', value: payrollTotal, color: 'var(--sx-primary-500)' },
    { label: 'Toll & RTO', value: catTotal(['Toll', 'RTO/Police']), color: '#0ea5e9' },
    { label: 'Repairs', value: catTotal(['Repairs']), color: '#8b5cf6' },
    { label: 'Other', value: catTotal(['Loading', 'Misc']), color: 'var(--sx-neutral-400)' },
  ].filter((s) => s.value > 0);

  // Real last-6-month trend. This used to splice five months of invented
  // history onto one live figure, which made a brand-new account look like a
  // going concern. Revenue is bucketed from the trips' own timestamps; nothing
  // is drawn for a month that has no data.
  const { monthLabels, revSeries, expSeries } = useMemo(() => {
    const now = new Date();
    const buckets = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { label: d.toLocaleDateString('en-IN', { month: 'short' }), y: d.getFullYear(), m: d.getMonth() };
    });
    const inBucket = (ms: number | undefined, b: { y: number; m: number }) => {
      if (!ms) return false;
      const d = new Date(ms);
      return d.getFullYear() === b.y && d.getMonth() === b.m;
    };
    return {
      monthLabels: buckets.map((b) => b.label),
      revSeries: buckets.map((b) => trips.filter((t) => inBucket(t.createdAtMs, b)).reduce((s, t) => s + t.freightPaise, 0)),
      // Expenses/fuel/payroll carry no timestamp yet (they're still local and
      // move to Firestore next), so only the current month can be placed.
      expSeries: buckets.map((_, i) => (i === 5 ? expenseTotal : 0)),
    };
  }, [trips, expenseTotal]);

  const unpaid = invoices.filter((i) => i.status !== 'paid').sort((a, b) => b.totalPaise - a.totalPaise);

  // Live document-expiry alerts from truck & driver expiry dates (≤60 days).
  type Alert = { reg: string; doc: string; days: number };
  const nowMs = Date.now();
  const mkAlert = (reg: string, doc: string, exp?: string): Alert | null => {
    if (!exp) return null;
    const t = Date.parse(exp);
    return isNaN(t) ? null : { reg, doc, days: Math.round((t - nowMs) / 86400000) };
  };
  const liveAlerts: Alert[] = [
    ...trucks.flatMap((t) => [mkAlert(t.reg, 'Insurance', t.insuranceExpiry), mkAlert(t.reg, 'Fitness', t.fitnessExpiry)]),
    ...drivers.map((d) => mkAlert(d.name, 'Licence', d.licenseExpiry)),
  ].filter((x): x is Alert => x !== null && x.days <= 60).sort((a, b) => a.days - b.days).slice(0, 5);

  // ── Operations pulse (team leader / admin) ──────────────────────────────────
  const activeRuns = board.filter((i) => !inLane(i, 'Completed'));
  const inTransitRuns = board.filter((i) => inLane(i, 'In Transit'));
  const overdueRuns = inTransitRuns.filter((i) => isOverdue(i, nowMs));
  const staleRuns = inTransitRuns.filter((i) => !i.lastUpdatedMs || nowMs - i.lastUpdatedMs > STALE_UPDATE_MS);
  const delayedRuns = board.filter((i) => (i.source.reports?.length ?? 0) > 0 && !inLane(i, 'Completed'));
  // On-time = active runs not currently overdue on their next update.
  const onTimePct = activeRuns.length ? Math.round(((activeRuns.length - overdueRuns.length) / activeRuns.length) * 100) : 100;
  // Delay rate = active runs carrying at least one delay report.
  const delayPct = activeRuns.length ? Math.round((delayedRuns.length / activeRuns.length) * 100) : 0;
  const updatedRuns = inTransitRuns.length - staleRuns.length;
  const activeNow = activity.filter((a) => presence(a) === 'active').length;
  const onBreakNow = activity.filter((a) => presence(a) === 'break').length;
  // Runs that need a look: overdue on schedule, or no update in 30+ minutes.
  const attention = [...new Set([...overdueRuns, ...staleRuns])].slice(0, 6);

  const todayLabel = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <PartnerLayout title="Dashboard" subtitle={`${BRAND.company} · ${todayLabel}`}>
      <div className="space-y-6">
        {/* Owner/manager/team-leader see their team; workers see their own day */}
        {isLead ? <TeamMix /> : <MyDayStrip />}

        {/* Quick actions — everyone gets the operational ones. */}
        <div className="flex flex-wrap items-center gap-2">
          <QuickAction to="/p/trips" icon={<Plus size={13} />} label="New Trip" />
          <QuickAction to="/p/tours" icon={<RouteIcon size={13} />} label="Route Assign" />
          <QuickAction to="/p/fleet" icon={<Users size={13} />} label="Add driver" />
          {seesMoney && <QuickAction to="/p/invoices" icon={<FileText size={13} />} label="Add MIS" />}
          {seesMoney && <QuickAction to="/p/expenses" icon={<Fuel size={13} />} label="Log fuel" />}
        </div>

        {/* Operations pulse — team leader & admin. Summaries, not money: on-time,
            delays, updates and who's online, per the client's ops-lead brief. */}
        {isLead && (
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4 stagger">
            <StatCard label="On-time" value={`${onTimePct}%`} icon={<CheckCircle2 size={16} />} tone={onTimePct >= 90 ? 'success' : onTimePct >= 70 ? 'accent' : 'danger'} hint={`${activeRuns.length} active runs`} />
            <StatCard label="Delay rate" value={`${delayPct}%`} icon={<Timer size={16} />} tone={delayPct === 0 ? 'success' : delayPct <= 20 ? 'accent' : 'danger'} hint={`${delayedRuns.length} with a report`} />
            <StatCard label="Updated" value={`${updatedRuns}/${inTransitRuns.length}`} icon={<Navigation size={16} />} tone={staleRuns.length === 0 ? 'success' : 'danger'} hint={`${staleRuns.length} need an update`} />
            <StatCard label="Online now" value={String(activeNow)} icon={<Circle size={16} />} tone="primary" hint={`${onBreakNow} on break`} />
          </section>
        )}

        {/* Needs attention — overdue or no-update-in-30-min runs (leads). */}
        {isLead && attention.length > 0 && (
          <Card>
            <CardHeader title="Needs attention" subtitle="Overdue on schedule, or no update in 30+ minutes"
              action={<Link to="/p/trips?f=In Transit" className="text-xs font-bold text-primary-600">In transit →</Link>} />
            <div className="divide-y divide-neutral-100">
              {attention.map((i) => {
                const stale = !i.lastUpdatedMs || nowMs - i.lastUpdatedMs > STALE_UPDATE_MS;
                const over = isOverdue(i, nowMs);
                return (
                  <div key={`${i.kind}-${i.id || i.code}`} className="flex items-center gap-3 px-5 py-2.5">
                    <AlertTriangle size={15} className="shrink-0 text-rose-500" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-neutral-900">{i.code}</span>
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase ${i.kind === 'tour' ? 'bg-amber-100 text-amber-800' : 'bg-neutral-100 text-neutral-600'}`}>{i.kind === 'tour' ? 'Amazon' : 'Trip'}</span>
                        <span className="truncate text-xs text-neutral-500">{i.driver || '—'}{i.vehicle ? ` · ${i.vehicle}` : ''}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {over && <Badge tone="danger">Overdue</Badge>}
                      {stale && <Badge tone="warning">No update</Badge>}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Money KPIs — admin & accountant only (employees see no revenue). */}
        {seesMoney && (
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger">
            <StatCard label="Revenue" value={inr(revenue)} icon={<IndianRupee size={16} />} tone="primary" hint="gross freight" />
            <StatCard label="Net profit" value={inr(profit)} icon={<TrendingUp size={16} />} tone="success" hint={`${marginPct}% margin`} />
            <StatCard label="Outstanding" value={inr(outstanding)} icon={<Wallet size={16} />} tone="danger" hint="receivables" />
            <StatCard label="Active trips" value={String(activeTrips)} icon={<Navigation size={16} />} tone="accent" hint={`${board.length} total runs`} />
          </section>
        )}

        {/* Trips by status — one-glance view of where every trip stands */}
        <Card>
          <CardHeader title="Trips by status" subtitle="Where every trip stands right now" action={<Link to="/p/trips" className="text-xs font-bold text-primary-600">All trips →</Link>} />
          <CardBody>
            <div className="grid grid-cols-3 gap-3">
              <Link to="/p/trips?f=Upcoming" className="rounded-xl bg-sky-50 p-4 ring-1 ring-inset ring-sky-100 transition hover:-translate-y-0.5">
                <div className="text-2xl font-extrabold text-sky-700">{scheduled}</div>
                <div className="text-xs font-bold text-sky-600">Upcoming</div>
                <div className="mt-0.5 text-[10px] text-neutral-500">assigned, not started</div>
              </Link>
              <Link to="/p/trips?f=In Transit" className="rounded-xl bg-primary-50 p-4 ring-1 ring-inset ring-primary-100 transition hover:-translate-y-0.5">
                <div className="text-2xl font-extrabold text-primary-700">{ongoing}</div>
                <div className="text-xs font-bold text-primary-600">In Transit</div>
                <div className="mt-0.5 text-[10px] text-neutral-500">loading → in transit → POD</div>
              </Link>
              <Link to="/p/trips?f=Completed" className="rounded-xl bg-emerald-50 p-4 ring-1 ring-inset ring-emerald-100 transition hover:-translate-y-0.5">
                <div className="text-2xl font-extrabold text-emerald-700">{completed}</div>
                <div className="text-xs font-bold text-emerald-600">Completed</div>
                <div className="mt-0.5 text-[10px] text-neutral-500">delivered & closed</div>
              </Link>
            </div>

            {/* proportion bar across all six states */}
            <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-neutral-100">
              {STATUS_ORDER.map((s) => {
                const c = statusCount(s.st);
                return c > 0 ? <div key={s.st} style={{ flexGrow: c, background: s.color }} title={`${s.label}: ${c}`} /> : null;
              })}
            </div>

            {/* per-state legend with counts */}
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {STATUS_ORDER.map((s) => (
                <div key={s.st} className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: s.color }} />
                  <span className="text-neutral-600">{s.label}</span>
                  <span className="ml-auto font-bold text-neutral-900">{statusCount(s.st)}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Charts row — money, admin & accountant only */}
        {seesMoney && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader title="Revenue vs expense" subtitle="Trend · current month is live" />
            <CardBody>
              <BarPairChart
                labels={monthLabels} a={revSeries} b={expSeries}
                aColor="var(--sx-primary-500)" aLabel="Revenue"
                bColor="var(--sx-accent-500)" bLabel="Expense"
                format={inr}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Expense breakdown" subtitle="This month" />
            <CardBody>
              <Donut
                segments={expenseSegments}
                centerMain={inr(expenseTotal)}
                centerSub="total"
              />
            </CardBody>
          </Card>
        </section>
        )}

        {/* Money health row — admin & accountant only */}
        {seesMoney && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Outstanding — live unpaid invoices */}
          <Card>
            <CardHeader title="Outstanding" subtitle="Unpaid invoices" action={<Link to="/p/invoices" className="text-xs font-bold text-primary-600">Invoices →</Link>} />
            <CardBody className="space-y-2.5">
              {unpaid.length === 0 && <p className="text-sm text-neutral-500">All invoices paid. 🎉</p>}
              {unpaid.slice(0, 5).map((i) => (
                <div key={i.no} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-neutral-800">{i.client}</div>
                    <div className="font-mono text-[10px] text-neutral-400">{i.no}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={i.status === 'overdue' ? 'danger' : 'warning'}>{i.status === 'overdue' ? 'Overdue' : 'Pending'}</Badge>
                    <span className="text-sm font-bold text-neutral-900">{inr(i.totalPaise)}</span>
                  </div>
                </div>
              ))}
              {unpaid.length > 0 && (
                <div className="flex items-center justify-between border-t border-neutral-100 pt-2.5 text-sm">
                  <span className="font-semibold text-neutral-600">Total outstanding</span>
                  <span className="font-extrabold text-neutral-900">{inr(outstanding)}</span>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Collections gauge */}
          <Card>
            <CardHeader title="Collections" subtitle="This month" />
            <CardBody className="flex flex-col items-center justify-center py-2">
              <RadialGauge value={collectPct} color="#10b981" label={`${collectPct}%`} sub="collected" />
              <div className="mt-2 text-center text-xs text-neutral-500">
                {inr(collected)} of {inr(collected + outstanding)}
              </div>
            </CardBody>
          </Card>

          {/* Fuel leakage */}
          <Card>
            <CardHeader title="Fuel control" subtitle="Actual vs calculated" action={<Fuel size={15} className="text-accent-500" />} />
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">Actual</span>
                <span className="font-bold text-neutral-900">{inr(fuelActual)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">Expected</span>
                <span className="font-bold text-neutral-900">{inr(fuelExpected)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-rose-50 px-3 py-2 ring-1 ring-inset ring-rose-100">
                <span className="flex items-center gap-1.5 text-xs font-bold text-rose-700"><AlertTriangle size={13} /> Leakage flag</span>
                <span className="font-extrabold text-rose-700">{inr(fuelLeak)}</span>
              </div>
              <p className="text-[11px] text-neutral-500">Gap between diesel bought and (distance ÷ mileage × rate). Worth a check.</p>
            </CardBody>
          </Card>
        </section>
        )}

        {/* Live trips + fleet + alerts */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader title="Live trips" subtitle="In progress now" action={<Link to="/p/trips" className="text-xs font-bold text-primary-600">All trips →</Link>} />
            <div className="divide-y divide-neutral-100">
              {trips.filter((t) => t.status !== 'closed').map((t) => (
                <div key={t.lr} className="flex items-center gap-3 px-5 py-3">
                  <VehicleArt type={trucks.find((x) => x.reg === t.vehicleReg)?.type ?? 'truck'} className="h-8 w-12 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-neutral-900">{t.lr}</span>
                      <Badge tone={TRIP_BADGE[t.status].tone}>{TRIP_BADGE[t.status].label}</Badge>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-neutral-500">{t.from} → {t.to} · {t.driver}</div>
                  </div>
                  <div className="text-right">
                    {seesMoney && <div className="text-sm font-bold text-neutral-900">{inr(t.freightPaise)}</div>}
                    <div className="text-[10px] text-neutral-400">{t.weightKg.toLocaleString('en-IN')} kg</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="space-y-6">
            {/* Fleet utilization */}
            <Card>
              <CardHeader title="Fleet status" subtitle={`${trucks.length} vehicles`} action={<GaugeIcon size={15} className="text-primary-500" />} />
              <CardBody>
                <Donut
                  size={132} thickness={18}
                  segments={[
                    { label: 'On trip', value: onTrip, color: 'var(--sx-primary-500)' },
                    { label: 'Available', value: available, color: '#10b981' },
                    { label: 'Maintenance', value: maintenance, color: '#f43f5e' },
                  ]}
                  centerMain={`${utilization}%`}
                  centerSub="utilized"
                />
              </CardBody>
            </Card>

            {/* Maintenance & compliance reminders — insurance, fitness and licence
                expiry (the client's "maintenance reminders"). */}
            <Card>
              <CardHeader title="Maintenance & compliance" subtitle="Renewals due soon"
                action={<span className="inline-flex items-center gap-1 text-xs font-bold text-neutral-500"><Wrench size={13} /> <Badge tone={liveAlerts.length ? 'danger' : 'success'}>{liveAlerts.length}</Badge></span>} />
              <CardBody className="space-y-2">
                {liveAlerts.length === 0 && <p className="text-sm text-neutral-500">Insurance, fitness &amp; licences all valid.</p>}
                {liveAlerts.map((d) => (
                  <div key={`${d.reg}-${d.doc}`} className={`flex items-center gap-2.5 rounded-lg p-2.5 ring-1 ring-inset ${d.days <= 7 ? 'bg-rose-50 ring-rose-100' : 'bg-amber-50 ring-amber-100'}`}>
                    <AlertTriangle size={15} className={d.days <= 7 ? 'text-rose-500' : 'text-amber-500'} />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-neutral-800">{d.doc}</div>
                      <div className="font-mono text-[10px] text-neutral-500">{d.reg}</div>
                    </div>
                    <span className={`text-xs font-extrabold ${d.days <= 7 ? 'text-rose-600' : 'text-amber-700'}`}>{d.days < 0 ? 'Expired' : `${d.days}d`}</span>
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>
        </section>

        {/* Footer strip: quick counts */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/p/fleet" className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-inset ring-neutral-200 transition hover:-translate-y-0.5 hover:ring-primary-200">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600"><TruckIcon size={18} /></span>
            <div><div className="text-lg font-extrabold text-neutral-900">{trucks.length}</div><div className="text-xs text-neutral-500">Vehicles</div></div>
            <ArrowRight size={15} className="ml-auto text-neutral-300" />
          </Link>
          <Link to="/p/fleet" className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-inset ring-neutral-200 transition hover:-translate-y-0.5 hover:ring-primary-200">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><Users size={18} /></span>
            <div><div className="text-lg font-extrabold text-neutral-900">{drivers.length}</div><div className="text-xs text-neutral-500">Drivers</div></div>
            <ArrowRight size={15} className="ml-auto text-neutral-300" />
          </Link>
          {seesMoney ? (
            <Link to="/p/expenses" className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-inset ring-neutral-200 transition hover:-translate-y-0.5 hover:ring-primary-200">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600"><Fuel size={18} /></span>
              <div><div className="text-lg font-extrabold text-neutral-900">{inr(fuelActual)}</div><div className="text-xs text-neutral-500">Fuel</div></div>
              <ArrowRight size={15} className="ml-auto text-neutral-300" />
            </Link>
          ) : (
            <Link to="/p/tours" className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-inset ring-neutral-200 transition hover:-translate-y-0.5 hover:ring-primary-200">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600"><RouteIcon size={18} /></span>
              <div><div className="text-lg font-extrabold text-neutral-900">{tours.filter((t) => !t.archived).length}</div><div className="text-xs text-neutral-500">Amazon tours</div></div>
              <ArrowRight size={15} className="ml-auto text-neutral-300" />
            </Link>
          )}
          <Link to="/p/trips" className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-inset ring-neutral-200 transition hover:-translate-y-0.5 hover:ring-primary-200">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600"><Navigation size={18} /></span>
            <div><div className="text-lg font-extrabold text-neutral-900">{trips.length}</div><div className="text-xs text-neutral-500">Trips</div></div>
            <ArrowRight size={15} className="ml-auto text-neutral-300" />
          </Link>
        </section>
      </div>
    </PartnerLayout>
  );
}
