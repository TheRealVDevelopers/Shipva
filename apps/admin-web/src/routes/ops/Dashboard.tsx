import { Link } from 'react-router-dom';
import {
  Radio, Users, Gavel, ShieldCheck, IndianRupee, Package, Truck, TrendingUp,
} from 'lucide-react';
import { OpsLayout } from '../../components/layout/OpsLayout.js';
import { KpiCard } from '../../components/ui/KpiCard.js';
import { Card, CardHeader, CardBody } from '../../components/ui/Card.js';
import { Table, THead, Th, TBody, Tr, Td } from '../../components/ui/Table.js';
import { BookingStatusBadge } from '../../components/ui/StatusBadge.js';
import { Badge } from '../../components/ui/Badge.js';
import { bookings, drivers, counters } from '../../lib/mocks.js';
import { rupees, relativeTime } from '../../lib/format.js';

const NOW = Date.parse('2026-06-27T15:30:00+05:30');

export function Dashboard() {
  const recent = bookings.slice(0, 6);
  const online = drivers.filter((d) => d.dutyStatus !== 'offline');

  return (
    <OpsLayout title="Dashboard" subtitle="Today · 27 Jun 2026 · Bengaluru">
      <div className="space-y-6">
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Live bookings" value={String(counters.liveBookings)} hint={`${counters.onJobDrivers} drivers on a job`} tone="primary" icon={<Radio size={14} />} />
          <KpiCard label="Online drivers" value={String(counters.onlineDrivers)} hint="ready to accept" tone="success" icon={<Users size={14} />} />
          <KpiCard label="Open auctions" value={String(counters.openAuctions)} hint="bids closing today" tone="accent" icon={<Gavel size={14} />} />
          <KpiCard label="Pending KYC" value={String(counters.pendingKyc)} hint="needs verification" tone="danger" icon={<ShieldCheck size={14} />} />
        </section>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Delivered today" value={String(counters.deliveredToday)} hint="across all zones" tone="primary" icon={<Package size={14} />} />
          <KpiCard label="GMV today" value={rupees(counters.gmvTodayPaise)} hint="gross marketplace value" tone="success" icon={<IndianRupee size={14} />} />
          <KpiCard label="Exchange — open" value={String(counters.exchangeOpen)} hint="loads + trucks posted" tone="primary" icon={<Truck size={14} />} />
          <KpiCard label="Backhaul fills" value={String(counters.backhaulFills)} hint="empty legs filled today" tone="accent" icon={<TrendingUp size={14} />} />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader
              title="Recent bookings"
              subtitle="Instant + auction across zones"
              action={<Link to="/ops/bookings" className="text-xs font-medium text-primary-600 hover:text-primary-700">View all →</Link>}
            />
            <Table>
              <THead>
                <Tr>
                  <Th>Code</Th><Th>Customer</Th><Th>Route</Th><Th>Type</Th><Th>Status</Th><Th className="text-right">Value</Th>
                </Tr>
              </THead>
              <TBody>
                {recent.map((b) => (
                  <Tr key={b.bookingId}>
                    <Td className="font-mono text-xs text-neutral-900">{b.bookingId}</Td>
                    <Td className="font-medium">{b.customer}</Td>
                    <Td className="text-neutral-600">{b.pickup} → {b.drop}</Td>
                    <Td><Badge tone={b.type === 'auction' ? 'accent' : 'neutral'}>{b.type}</Badge></Td>
                    <Td><BookingStatusBadge status={b.status} /></Td>
                    <Td className="text-right font-medium">{rupees(b.farePaise ?? b.basePricePaise ?? 0)}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader title="Online drivers" subtitle="Available now" action={<Link to="/ops/drivers" className="text-xs font-medium text-primary-600 hover:text-primary-700">All →</Link>} />
              <CardBody className="space-y-2.5">
                {online.map((d) => (
                  <div key={d.driverId} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xs font-semibold">
                      {d.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-neutral-900 truncate">{d.name}</div>
                      <div className="text-[11px] text-neutral-500">{d.zone} · ★ {d.ratingAvg || '—'}</div>
                    </div>
                    <Badge tone={d.dutyStatus === 'on_job' ? 'accent' : 'success'}>{d.dutyStatus === 'on_job' ? 'on job' : 'online'}</Badge>
                  </div>
                ))}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="KASSIA + association" subtitle="Concentrated B2B demand" />
              <CardBody className="space-y-2 text-sm">
                <div className="flex items-center justify-between"><span className="text-neutral-600">Industry auctions live</span><span className="font-medium">2</span></div>
                <div className="flex items-center justify-between"><span className="text-neutral-600">Verified transporters</span><span className="font-medium">3</span></div>
                <div className="pt-2 mt-1 border-t border-neutral-100 flex items-center gap-1.5 text-xs text-emerald-700">
                  <TrendingUp size={12} /> Density focus: Peenya + Whitefield corridors
                </div>
              </CardBody>
            </Card>
          </div>
        </section>
      </div>
    </OpsLayout>
  );
}
