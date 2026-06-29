import { Link } from 'react-router-dom';
import { Navigation, Users, PackageSearch, IndianRupee, ArrowRight, BadgeCheck } from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { KpiCard } from '../../components/ui/KpiCard.js';
import { Card, CardHeader, CardBody } from '../../components/ui/Card.js';
import { Table, THead, Th, TBody, Tr, Td } from '../../components/ui/Table.js';
import { Badge } from '../../components/ui/Badge.js';
import { BookingStatusBadge } from '../../components/ui/StatusBadge.js';
import { VehicleArt } from '../../components/art.js';
import { counters, activeJobs, loadBoard, subscription } from '../../lib/mocks.js';
import { rupees } from '../../lib/format.js';

export function Overview() {
  const claimable = loadBoard.slice(0, 3);
  return (
    <PartnerLayout title="Overview" subtitle="Karnataka Roadlines · today">
      <div className="space-y-6">
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger">
          <KpiCard label="Active jobs" value={String(counters.activeJobs)} hint="in progress now" tone="primary" icon={<Navigation size={14} />} />
          <KpiCard label="Drivers online" value={String(counters.driversOnline)} hint="ready to assign" tone="success" icon={<Users size={14} />} />
          <KpiCard label="Loads to claim" value={String(counters.loadsToClaim)} hint="on your board" tone="accent" icon={<PackageSearch size={14} />} />
          <KpiCard label="Earnings · month" value={rupees(counters.earningsMonthPaise)} hint="you keep 100%" tone="success" icon={<IndianRupee size={14} />} />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader title="Live jobs" subtitle="Trips in progress" action={<Link to="/p/jobs" className="text-xs font-bold text-primary-600">View all →</Link>} />
            <Table>
              <THead><Tr><Th>Code</Th><Th>Route</Th><Th>Driver</Th><Th>Status</Th><Th>ETA</Th></Tr></THead>
              <TBody>
                {activeJobs.map((j) => (
                  <Tr key={j.id}>
                    <Td className="font-mono text-xs text-neutral-900">{j.id}</Td>
                    <Td className="text-neutral-700">{j.from} → {j.to}</Td>
                    <Td className="font-semibold">{j.driverName}</Td>
                    <Td><BookingStatusBadge status={j.status} /></Td>
                    <Td className="text-neutral-600">{j.etaMin} min</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader title="Loads to claim" subtitle="Top matches" action={<Link to="/p/loads" className="text-xs font-bold text-primary-600">Board →</Link>} />
              <CardBody className="space-y-2.5">
                {claimable.map((l) => (
                  <div key={l.id} className="flex items-center gap-3 rounded-xl ring-1 ring-inset ring-neutral-200 p-2.5">
                    <VehicleArt type={l.vehicleType} className="h-7 w-10 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm font-bold text-neutral-900">{l.from} → {l.to}</div>
                      <div className="text-[11px] text-neutral-500">{l.poster}{l.kind === 'backhaul' && <Badge tone="accent" className="ml-1 !text-[9px]">backhaul</Badge>}</div>
                    </div>
                    <div className="text-sm font-extrabold text-neutral-900">{rupees(l.basePricePaise)}</div>
                  </div>
                ))}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Your plan" subtitle="Subscription" action={<BadgeCheck size={16} className="text-emerald-500" />} />
              <CardBody className="space-y-2 text-sm">
                <div className="flex items-center justify-between"><span className="text-neutral-600">Tier</span><span className="font-extrabold">{subscription.tier} · {rupees(subscription.pricePaise)}/mo</span></div>
                <div className="flex items-center justify-between"><span className="text-neutral-600">Driver slots</span><span className="font-semibold">{subscription.driversUsed}/{subscription.driverSlots}</span></div>
                <div className="flex items-center justify-between"><span className="text-neutral-600">Renews</span><span className="font-semibold">{subscription.renewalOn}</span></div>
                <Link to="/p/subscription" className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-primary-600">Manage plan <ArrowRight size={11} /></Link>
              </CardBody>
            </Card>
          </div>
        </section>
      </div>
    </PartnerLayout>
  );
}
