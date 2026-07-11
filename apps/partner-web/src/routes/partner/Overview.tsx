import { Link } from 'react-router-dom';
import {
  IndianRupee, TrendingUp, Wallet, Navigation, Fuel, AlertTriangle, ArrowRight,
  Users, Truck as TruckIcon, FileText, Plus, Gauge as GaugeIcon,
} from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card, CardHeader, CardBody } from '../../components/ui/Card.js';
import { StatCard } from '../../components/ui/StatCard.js';
import { Badge, type BadgeTone } from '../../components/ui/Badge.js';
import { BarPairChart, Donut, RadialGauge, HBar } from '../../components/ui/Charts.js';
import { VehicleArt } from '../../components/art.js';
import { rupees } from '../../lib/format.js';
import {
  osCounters, months6, revenueSeries, expenseSeries, expenseBreakdown, receivables,
  fuel, docAlerts, sparks, type TripStatus,
} from '../../lib/mocks.js';
import { useStore } from '../../lib/store.js';
import { BRAND } from '../../lib/brand.js';

const TRIP_BADGE: Record<TripStatus, { label: string; tone: BadgeTone }> = {
  assigned: { label: 'Assigned', tone: 'info' },
  loading: { label: 'Loading', tone: 'accent' },
  in_transit: { label: 'In transit', tone: 'primary' },
  at_drop: { label: 'At drop', tone: 'primary' },
  pod_pending: { label: 'POD pending', tone: 'warning' },
  closed: { label: 'Closed', tone: 'success' },
};

function QuickAction({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-bold text-neutral-700 ring-1 ring-inset ring-neutral-200 transition hover:-translate-y-0.5 hover:text-primary-700 hover:ring-primary-200">
      {icon} {label}
    </Link>
  );
}

export function Overview() {
  const { trips, trucks } = useStore();
  const onTrip = trucks.filter((t) => t.status === 'on_trip').length;
  const available = trucks.filter((t) => t.status === 'available').length;
  const maintenance = trucks.filter((t) => t.status === 'maintenance').length;
  const collectPct = Math.round(
    (receivables.collectedMtdPaise / (receivables.collectedMtdPaise + receivables.outstandingPaise)) * 100,
  );
  const inr = (n: number) => rupees(n);

  return (
    <PartnerLayout title="Overview" subtitle={`${BRAND.company} · June 2026`}>
      <div className="space-y-6">
        {/* Quick actions */}
        <div className="flex flex-wrap items-center gap-2">
          <QuickAction to="/p/trips" icon={<Plus size={13} />} label="New trip / LR" />
          <QuickAction to="/p/invoices" icon={<FileText size={13} />} label="Raise invoice" />
          <QuickAction to="/p/fleet" icon={<Users size={13} />} label="Add driver" />
          <QuickAction to="/p/expenses" icon={<Fuel size={13} />} label="Log fuel" />
        </div>

        {/* Hero KPIs */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger">
          <StatCard label="Revenue · MTD" value={inr(osCounters.revenueMtdPaise)} icon={<IndianRupee size={16} />} tone="primary" deltaPct={12} hint="vs May" spark={sparks.revenue} />
          <StatCard label="Net profit · MTD" value={inr(osCounters.profitMtdPaise)} icon={<TrendingUp size={16} />} tone="success" deltaPct={8} hint={`${osCounters.avgMarginPct}% margin`} spark={sparks.profit} />
          <StatCard label="Outstanding" value={inr(osCounters.outstandingPaise)} icon={<Wallet size={16} />} tone="danger" deltaPct={-4} hint="receivables" spark={sparks.outstanding} />
          <StatCard label="Active trips" value={String(osCounters.activeTrips)} icon={<Navigation size={16} />} tone="accent" hint={`${osCounters.tripsMtd} this month`} spark={sparks.trips} />
        </section>

        {/* Charts row */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader title="Revenue vs expense" subtitle="Last 6 months" action={<Badge tone="success"><TrendingUp size={11} /> +9% MoM</Badge>} />
            <CardBody>
              <BarPairChart
                labels={months6} a={revenueSeries} b={expenseSeries}
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
                segments={expenseBreakdown}
                centerMain={inr(osCounters.expenseMtdPaise)}
                centerSub="total"
              />
            </CardBody>
          </Card>
        </section>

        {/* Money health row */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Receivables aging */}
          <Card>
            <CardHeader title="Receivables aging" subtitle="Who owes you" action={<Link to="/p/invoices" className="text-xs font-bold text-primary-600">Invoices →</Link>} />
            <CardBody className="space-y-3">
              {receivables.aging.map((a) => {
                const barColor = { success: '#10b981', warning: '#f59e0b', accent: 'var(--sx-accent-500)', danger: '#f43f5e' }[a.tone];
                return (
                  <div key={a.bucket}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-neutral-700">{a.bucket}</span>
                      <span className="font-bold text-neutral-900">{inr(a.amountPaise)}</span>
                    </div>
                    <div className="mt-1"><HBar value={a.amountPaise} max={receivables.outstandingPaise} color={barColor} /></div>
                  </div>
                );
              })}
            </CardBody>
          </Card>

          {/* Collections gauge */}
          <Card>
            <CardHeader title="Collections" subtitle="This month" />
            <CardBody className="flex flex-col items-center justify-center py-2">
              <RadialGauge value={collectPct} color="#10b981" label={`${collectPct}%`} sub="collected" />
              <div className="mt-2 text-center text-xs text-neutral-500">
                {inr(receivables.collectedMtdPaise)} of {inr(receivables.collectedMtdPaise + receivables.outstandingPaise)}
              </div>
            </CardBody>
          </Card>

          {/* Fuel leakage */}
          <Card>
            <CardHeader title="Fuel control" subtitle="Actual vs calculated" action={<Fuel size={15} className="text-accent-500" />} />
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">Actual (MTD)</span>
                <span className="font-bold text-neutral-900">{inr(fuel.mtdCostPaise)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">Expected</span>
                <span className="font-bold text-neutral-900">{inr(fuel.expectedPaise)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-rose-50 px-3 py-2 ring-1 ring-inset ring-rose-100">
                <span className="flex items-center gap-1.5 text-xs font-bold text-rose-700"><AlertTriangle size={13} /> Leakage flag</span>
                <span className="font-extrabold text-rose-700">{inr(fuel.leakagePaise)}</span>
              </div>
              <p className="text-[11px] text-neutral-500">Gap between diesel bought and (distance ÷ mileage × rate). Worth a check.</p>
            </CardBody>
          </Card>
        </section>

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
                    <div className="text-sm font-bold text-neutral-900">{inr(t.freightPaise)}</div>
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
                  centerMain={`${osCounters.utilizationPct}%`}
                  centerSub="utilized"
                />
              </CardBody>
            </Card>

            {/* Document expiry alerts */}
            <Card>
              <CardHeader title="Document alerts" subtitle="Expiring soon" action={<Badge tone="danger">{docAlerts.length}</Badge>} />
              <CardBody className="space-y-2">
                {docAlerts.map((d) => (
                  <div key={`${d.reg}-${d.doc}`} className={`flex items-center gap-2.5 rounded-lg p-2.5 ring-1 ring-inset ${d.dueInDays <= 7 ? 'bg-rose-50 ring-rose-100' : 'bg-amber-50 ring-amber-100'}`}>
                    <AlertTriangle size={15} className={d.dueInDays <= 7 ? 'text-rose-500' : 'text-amber-500'} />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-neutral-800">{d.doc}</div>
                      <div className="font-mono text-[10px] text-neutral-500">{d.reg}</div>
                    </div>
                    <span className={`text-xs font-extrabold ${d.dueInDays <= 7 ? 'text-rose-600' : 'text-amber-700'}`}>{d.dueInDays}d</span>
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
            <div><div className="text-lg font-extrabold text-neutral-900">{osCounters.fleetSize}</div><div className="text-xs text-neutral-500">Vehicles</div></div>
            <ArrowRight size={15} className="ml-auto text-neutral-300" />
          </Link>
          <Link to="/p/fleet" className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-inset ring-neutral-200 transition hover:-translate-y-0.5 hover:ring-primary-200">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><Users size={18} /></span>
            <div><div className="text-lg font-extrabold text-neutral-900">{osCounters.driversTotal}</div><div className="text-xs text-neutral-500">Drivers</div></div>
            <ArrowRight size={15} className="ml-auto text-neutral-300" />
          </Link>
          <Link to="/p/expenses" className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-inset ring-neutral-200 transition hover:-translate-y-0.5 hover:ring-primary-200">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600"><Fuel size={18} /></span>
            <div><div className="text-lg font-extrabold text-neutral-900">{inr(osCounters.fuelMtdPaise)}</div><div className="text-xs text-neutral-500">Fuel · MTD</div></div>
            <ArrowRight size={15} className="ml-auto text-neutral-300" />
          </Link>
          <Link to="/p/trips" className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-inset ring-neutral-200 transition hover:-translate-y-0.5 hover:ring-primary-200">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600"><Navigation size={18} /></span>
            <div><div className="text-lg font-extrabold text-neutral-900">{osCounters.tripsMtd}</div><div className="text-xs text-neutral-500">Trips · MTD</div></div>
            <ArrowRight size={15} className="ml-auto text-neutral-300" />
          </Link>
        </section>
      </div>
    </PartnerLayout>
  );
}
