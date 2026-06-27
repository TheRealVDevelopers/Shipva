import { Building2, Package, Truck, ArrowLeftRight, Plus } from 'lucide-react';
import { OpsLayout } from '../../components/layout/OpsLayout.js';
import { Card, CardHeader, CardBody } from '../../components/ui/Card.js';
import { Table, THead, Th, TBody, Tr, Td } from '../../components/ui/Table.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { VerifyBadge } from '../../components/ui/StatusBadge.js';
import { transporters, loadPosts, truckPosts } from '../../lib/mocks.js';
import { rupees, shortDate } from '../../lib/format.js';

export function Transporters() {
  const pending = transporters.filter((t) => t.verifyStatus === 'pending');

  return (
    <OpsLayout title="Transporter exchange" subtitle="Verified companies trade spare loads & trucks — backhaul fills empty legs">
      <div className="space-y-6">
        {pending.length > 0 && (
          <Card className="ring-amber-200">
            <CardHeader title={`${pending.length} transporter awaiting verification`} subtitle="Approve company + GST docs to admit to the exchange" />
            <CardBody className="space-y-3">
              {pending.map((t) => (
                <div key={t.transporterId} className="flex items-center gap-3 rounded-md bg-amber-50/40 ring-1 ring-inset ring-amber-100 p-3">
                  <Building2 size={18} className="text-amber-500 shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-neutral-900">{t.company}</div>
                    <div className="text-xs text-neutral-500 font-mono">{t.gstin} · {t.zone}</div>
                  </div>
                  <Button variant="secondary" size="sm">View docs</Button>
                  <Button size="sm">Verify</Button>
                </div>
              ))}
            </CardBody>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="Load board" subtitle="Loads needing a truck" action={<Button size="sm" variant="secondary"><Plus size={12} /> Post load</Button>} />
            <Table>
              <THead><Tr><Th>Company</Th><Th>Route</Th><Th>Vehicle</Th><Th>Date</Th><Th>Floor</Th><Th></Th></Tr></THead>
              <TBody>
                {loadPosts.map((l) => (
                  <Tr key={l.loadPostId}>
                    <Td className="font-medium text-neutral-900">{l.company}</Td>
                    <Td className="text-neutral-600">{l.origin} → {l.destination}{l.isBackhaul && <Badge tone="accent" className="ml-1 !text-[10px]">backhaul</Badge>}</Td>
                    <Td className="text-neutral-700">{l.vehicleType.replaceAll('_', ' ')}</Td>
                    <Td className="text-xs text-neutral-500">{shortDate(l.date)}</Td>
                    <Td className="font-medium">{rupees(l.basePricePaise)}</Td>
                    <Td><Badge tone={l.status === 'open' ? 'success' : l.status === 'claimed' ? 'warning' : 'neutral'}>{l.status}</Badge></Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </Card>

          <Card>
            <CardHeader title="Truck board" subtitle="Available trucks looking for loads" action={<Button size="sm" variant="secondary"><Plus size={12} /> Post truck</Button>} />
            <Table>
              <THead><Tr><Th>Company</Th><Th>At</Th><Th>Vehicle</Th><Th>Return route</Th><Th>From</Th><Th></Th></Tr></THead>
              <TBody>
                {truckPosts.map((k) => (
                  <Tr key={k.truckPostId}>
                    <Td className="font-medium text-neutral-900">{k.company}</Td>
                    <Td className="text-neutral-600">{k.location}</Td>
                    <Td className="text-neutral-700">{k.vehicleType.replaceAll('_', ' ')}</Td>
                    <Td className="text-neutral-600 text-xs flex items-center gap-1"><ArrowLeftRight size={11} className="text-primary-500" /> {k.returnRoute}</Td>
                    <Td className="text-xs text-neutral-500">{shortDate(k.availableDate)}</Td>
                    <Td><Badge tone={k.status === 'open' ? 'success' : k.status === 'connected' ? 'info' : 'warning'}>{k.status}</Badge></Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </Card>
        </div>

        <Card>
          <CardHeader title="Verified transporters" subtitle="On-platform reputation" />
          <Table>
            <THead><Tr><Th>Company</Th><Th>GSTIN</Th><Th>Zone</Th><Th>Fleet</Th><Th>Rating</Th><Th>Status</Th></Tr></THead>
            <TBody>
              {transporters.map((t) => (
                <Tr key={t.transporterId}>
                  <Td className="font-medium text-neutral-900 flex items-center gap-2"><Building2 size={14} className="text-neutral-400" /> {t.company}</Td>
                  <Td className="font-mono text-xs text-neutral-600">{t.gstin}</Td>
                  <Td className="text-neutral-600">{t.zone}</Td>
                  <Td className="text-neutral-700">{t.fleetSize} trucks</Td>
                  <Td>{t.ratingAvg > 0 ? `★ ${t.ratingAvg}` : <span className="text-neutral-400 text-xs">new</span>}</Td>
                  <Td><VerifyBadge status={t.verifyStatus} /></Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Card>

        <p className="text-xs text-neutral-500 flex items-center gap-1.5"><Truck size={11} /> Backhaul matching pairs an empty return leg with an open load — the saving is passed to the customer.</p>
      </div>
    </OpsLayout>
  );
}
