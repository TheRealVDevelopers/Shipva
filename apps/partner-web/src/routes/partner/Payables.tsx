import { Truck as TruckIcon, Phone, HandCoins } from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card, CardHeader, CardBody } from '../../components/ui/Card.js';
import { KpiCard } from '../../components/ui/KpiCard.js';
import { Table, THead, Th, TBody, Tr, Td } from '../../components/ui/Table.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { rupees } from '../../lib/format.js';
import { useStore } from '../../lib/store.js';

export function Payables() {
  const { attached } = useStore();
  const totalDue = attached.reduce((s, a) => s + a.balancePaise, 0);
  const owing = attached.filter((a) => a.balancePaise > 0).length;

  return (
    <PartnerLayout title="Payables" subtitle="Attached / market trucks & what you owe them">
      <div className="space-y-6">
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Attached trucks" value={String(attached.length)} hint="market vehicles" tone="primary" icon={<TruckIcon size={14} />} />
          <KpiCard label="Owners to pay" value={String(owing)} hint="balance pending" tone="danger" />
          <KpiCard label="Total payable" value={rupees(totalDue)} hint="advance + balance" tone="accent" icon={<HandCoins size={14} />} />
          <KpiCard label="Trips (market)" value={String(attached.reduce((s, a) => s + a.trips, 0))} hint="via attached" tone="success" />
        </section>

        <Card>
          <CardHeader
            title="Truck-owner ledger"
            subtitle="Balances owed to attached vehicles"
            action={<Button size="sm"><HandCoins size={13} /> Record payment</Button>}
          />
          <Table>
            <THead>
              <Tr><Th>Owner</Th><Th>Vehicle</Th><Th className="text-right">Trips</Th><Th className="text-right">Balance</Th><Th>Status</Th><Th></Th></Tr>
            </THead>
            <TBody>
              {attached.map((a) => (
                <Tr key={a.id}>
                  <Td>
                    <div className="font-semibold text-neutral-900">{a.owner}</div>
                    <div className="flex items-center gap-1 text-[11px] text-neutral-400"><Phone size={10} /> {a.phone}</div>
                  </Td>
                  <Td className="font-mono text-xs text-neutral-700">{a.reg}</Td>
                  <Td className="text-right text-neutral-600">{a.trips}</Td>
                  <Td className="text-right font-bold text-neutral-900">{a.balancePaise ? rupees(a.balancePaise) : '—'}</Td>
                  <Td>{a.balancePaise > 0 ? <Badge tone="warning">Owed</Badge> : <Badge tone="success">Settled</Badge>}</Td>
                  <Td><button className="text-xs font-bold text-primary-600 hover:text-primary-700">Pay</button></Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Card>

        <Card>
          <CardBody className="flex items-start gap-3 text-sm text-neutral-600">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600"><TruckIcon size={16} /></span>
            <p>Most Indian transporters run a mix of <span className="font-semibold text-neutral-800">owned</span> and <span className="font-semibold text-neutral-800">attached (market)</span> trucks. This ledger tracks advances and balance payments owed to the owners of those market vehicles — the payables side of your money, separate from customer receivables.</p>
          </CardBody>
        </Card>
      </div>
    </PartnerLayout>
  );
}
