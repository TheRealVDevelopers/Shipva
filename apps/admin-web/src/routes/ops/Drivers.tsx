import { useState } from 'react';
import { Phone, Star, Plus, ShieldCheck } from 'lucide-react';
import { OpsLayout } from '../../components/layout/OpsLayout.js';
import { Card, CardHeader, CardBody } from '../../components/ui/Card.js';
import { Table, THead, Th, TBody, Tr, Td } from '../../components/ui/Table.js';
import { DutyBadge, KycBadge } from '../../components/ui/StatusBadge.js';
import { Button } from '../../components/ui/Button.js';
import { drivers } from '../../lib/mocks.js';
import { rupees } from '../../lib/format.js';
import { VehicleArt } from '../../components/art.js';

const TABS = ['All', 'Online', 'On job', 'KYC queue'] as const;

export function Drivers() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('All');
  const pendingKyc = drivers.filter((d) => d.kycStatus === 'pending');

  const rows = drivers.filter((d) => {
    if (tab === 'All') return true;
    if (tab === 'Online') return d.dutyStatus === 'online';
    if (tab === 'On job') return d.dutyStatus === 'on_job';
    return d.kycStatus !== 'verified';
  });

  return (
    <OpsLayout title="Drivers" subtitle={`${drivers.length} total · ${drivers.filter((d) => d.dutyStatus !== 'offline').length} active now`}>
      <div className="space-y-6">
        {pendingKyc.length > 0 && (
          <Card className="ring-amber-200">
            <CardHeader title={`${pendingKyc.length} drivers awaiting KYC verification`} subtitle="Approve documents to let them go online" />
            <CardBody className="space-y-3">
              {pendingKyc.map((d) => (
                <div key={d.driverId} className="flex items-center gap-3 rounded-md bg-amber-50/40 ring-1 ring-inset ring-amber-100 p-3">
                  <ShieldCheck size={18} className="text-amber-500 shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-neutral-900">{d.name}</div>
                    <div className="text-xs text-neutral-500">{d.vehicleType.replaceAll('_', ' ')} · {d.vehicleReg} · {d.zone}</div>
                  </div>
                  <Button variant="secondary" size="sm">View docs</Button>
                  <Button variant="danger" size="sm">Reject</Button>
                  <Button size="sm">Approve</Button>
                </div>
              ))}
            </CardBody>
          </Card>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium ${tab === t ? 'bg-primary-500 text-white' : 'bg-white text-neutral-700 ring-1 ring-inset ring-neutral-200 hover:bg-neutral-50'}`}>
                {t}
              </button>
            ))}
          </div>
          <Button size="sm"><Plus size={12} /> Onboard driver</Button>
        </div>

        <Card>
          <Table>
            <THead>
              <Tr><Th>Driver</Th><Th>Vehicle</Th><Th>Zone</Th><Th>Duty</Th><Th>KYC</Th><Th>Today</Th><Th>Earnings</Th><Th>Rating</Th></Tr>
            </THead>
            <TBody>
              {rows.map((d) => (
                <Tr key={d.driverId}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold text-sm">
                        {d.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <div className="font-medium text-neutral-900">{d.name}</div>
                        <div className="flex items-center gap-1 text-xs text-neutral-500"><Phone size={10} /> {d.phone}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <VehicleArt type={d.vehicleType} className="h-6 w-9 shrink-0" />
                      <div>
                        <div className="font-mono text-xs text-neutral-700">{d.vehicleReg}</div>
                        <div className="text-xs text-neutral-400 capitalize">{d.vehicleType.replaceAll('_', ' ')}</div>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-neutral-600">{d.zone}</Td>
                  <Td><DutyBadge status={d.dutyStatus} /></Td>
                  <Td><KycBadge status={d.kycStatus} /></Td>
                  <Td className="text-neutral-700">{d.tripsToday > 0 ? `${d.tripsToday} trips` : <span className="text-neutral-400">—</span>}</Td>
                  <Td className="text-neutral-700">{d.earningsTodayPaise > 0 ? rupees(d.earningsTodayPaise) : <span className="text-neutral-400">—</span>}</Td>
                  <Td>{d.ratingCount > 0 ? <span className="inline-flex items-center gap-1 text-sm"><Star size={12} className="fill-orange-400 text-orange-400" /> {d.ratingAvg}</span> : <span className="text-neutral-400 text-xs">new</span>}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Card>
      </div>
    </OpsLayout>
  );
}
