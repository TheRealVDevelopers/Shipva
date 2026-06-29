import { Wallet, ShieldCheck, TrendingUp } from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card, CardHeader, CardBody } from '../../components/ui/Card.js';
import { Table, THead, Th, TBody, Tr, Td } from '../../components/ui/Table.js';
import { Badge } from '../../components/ui/Badge.js';
import { VehicleArt } from '../../components/art.js';
import { counters, earnings, payouts } from '../../lib/mocks.js';
import { rupees } from '../../lib/format.js';

export function Earnings() {
  return (
    <PartnerLayout title="Earnings" subtitle="You keep 100% — no commission, ever">
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-gradient-to-br from-primary-700 to-primary-900 p-5 text-white">
            <div className="flex items-center gap-1.5 text-xs text-primary-100"><Wallet size={13} /> Earned this month</div>
            <div className="mt-1 text-3xl font-extrabold">{rupees(counters.earningsMonthPaise)}</div>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-300"><ShieldCheck size={12} /> 0% commission · you keep it all</div>
          </div>
          <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200">
            <div className="flex items-center gap-1.5 text-xs text-neutral-500"><TrendingUp size={13} /> Completed jobs</div>
            <div className="mt-1 text-2xl font-extrabold text-neutral-900">{earnings.length}</div>
            <div className="mt-1 text-xs text-neutral-500">this month</div>
          </div>
          <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200">
            <div className="flex items-center gap-1.5 text-xs text-neutral-500"><Wallet size={13} /> Last settlement</div>
            <div className="mt-1 text-2xl font-extrabold text-neutral-900">{rupees(payouts[0]!.amountPaise)}</div>
            <div className="mt-1 text-xs text-neutral-500">{payouts[0]!.period} · settled directly</div>
          </div>
        </section>

        <Card>
          <CardHeader title="Per-job breakdown" subtitle="What each completed job earned" />
          <Table>
            <THead><Tr><Th>Code</Th><Th>Route</Th><Th>Driver</Th><Th>Vehicle</Th><Th>Date</Th><Th className="text-right">Earned</Th></Tr></THead>
            <TBody>
              {earnings.map((e) => (
                <Tr key={e.id}>
                  <Td className="font-mono text-xs">{e.id}</Td>
                  <Td className="text-neutral-700">{e.from} → {e.to}</Td>
                  <Td className="font-semibold">{e.driverName}</Td>
                  <Td><div className="flex items-center gap-2"><VehicleArt type={e.vehicleType} className="h-5 w-8" /><span className="capitalize text-xs text-neutral-500">{e.vehicleType.replaceAll('_', ' ')}</span></div></Td>
                  <Td className="text-xs text-neutral-500">{e.date}</Td>
                  <Td className="text-right font-extrabold text-emerald-700">+{rupees(e.payoutPaise)}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Card>

        <Card>
          <CardHeader title="Payout history" subtitle="Settled directly to your account (in-app payments come later)" />
          <Table>
            <THead><Tr><Th>Ref</Th><Th>Period</Th><Th>Settled on</Th><Th>Status</Th><Th className="text-right">Amount</Th></Tr></THead>
            <TBody>
              {payouts.map((p) => (
                <Tr key={p.id}>
                  <Td className="font-mono text-xs">{p.id}</Td>
                  <Td className="text-neutral-700">{p.period}</Td>
                  <Td className="text-xs text-neutral-500">{p.on}</Td>
                  <Td><Badge tone="success">{p.status}</Badge></Td>
                  <Td className="text-right font-bold">{rupees(p.amountPaise)}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Card>
      </div>
    </PartnerLayout>
  );
}
