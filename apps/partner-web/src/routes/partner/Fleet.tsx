import { useState } from 'react';
import { Phone, Star, Plus, Truck as TruckIcon, FileCheck2, AlertTriangle } from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card } from '../../components/ui/Card.js';
import { Table, THead, Th, TBody, Tr, Td } from '../../components/ui/Table.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { DutyBadge, KycBadge } from '../../components/ui/StatusBadge.js';
import { VehicleArt } from '../../components/art.js';
import { fleetDrivers, trucks } from '../../lib/mocks.js';

const TABS = ['Drivers', 'Trucks'] as const;

export function Fleet() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Drivers');

  return (
    <PartnerLayout title="My Fleet" subtitle={`${fleetDrivers.length} drivers · ${trucks.length} trucks`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`rounded-lg px-4 py-1.5 text-xs font-bold ${tab === t ? 'bg-primary-500 text-white' : 'bg-white text-neutral-700 ring-1 ring-inset ring-neutral-200'}`}>
                {t}
              </button>
            ))}
          </div>
          <Button size="sm"><Plus size={12} /> {tab === 'Drivers' ? 'Onboard driver' : 'Add truck'}</Button>
        </div>

        {tab === 'Drivers' ? (
          <Card>
            <Table>
              <THead><Tr><Th>Driver</Th><Th>Vehicle</Th><Th>Duty</Th><Th>KYC</Th><Th>Today</Th><Th>Rating</Th><Th></Th></Tr></THead>
              <TBody>
                {fleetDrivers.map((d) => (
                  <Tr key={d.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">{d.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}</span>
                        <div><div className="font-bold text-neutral-900">{d.name}</div><div className="flex items-center gap-1 text-xs text-neutral-500"><Phone size={10} /> {d.phone}</div></div>
                      </div>
                    </Td>
                    <Td><div className="flex items-center gap-2"><VehicleArt type={d.vehicleType} className="h-6 w-9 shrink-0" /><span className="font-mono text-xs text-neutral-700">{d.vehicleReg}</span></div></Td>
                    <Td><DutyBadge status={d.dutyStatus} /></Td>
                    <Td><KycBadge status={d.kycStatus} /></Td>
                    <Td className="text-neutral-700">{d.tripsToday > 0 ? `${d.tripsToday} trips` : <span className="text-neutral-400">—</span>}</Td>
                    <Td>{d.ratingAvg > 0 ? <span className="inline-flex items-center gap-1 text-sm"><Star size={12} className="fill-amber-400 text-amber-400" /> {d.ratingAvg}</span> : <span className="text-xs text-neutral-400">new</span>}</Td>
                    <Td><Button size="sm" variant="secondary" {...(d.dutyStatus === 'offline' ? { disabled: true } : {})}>Assign</Button></Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </Card>
        ) : (
          <Card>
            <Table>
              <THead><Tr><Th>Truck</Th><Th>Type</Th><Th>Capacity</Th><Th>Status</Th><Th>Docs</Th></Tr></THead>
              <TBody>
                {trucks.map((t) => (
                  <Tr key={t.id}>
                    <Td><div className="flex items-center gap-2"><VehicleArt type={t.type} className="h-7 w-10 shrink-0" /><span className="font-mono text-xs font-bold text-neutral-900">{t.reg}</span></div></Td>
                    <Td className="capitalize text-neutral-700">{t.type.replaceAll('_', ' ')}</Td>
                    <Td className="text-neutral-700">{t.capacityKg.toLocaleString('en-IN')} kg</Td>
                    <Td><Badge tone={t.status === 'available' ? 'success' : t.status === 'on_trip' ? 'info' : 'warning'}><TruckIcon size={10} /> {t.status.replaceAll('_', ' ')}</Badge></Td>
                    <Td>{t.docsOk ? <span className="inline-flex items-center gap-1 text-xs text-emerald-700"><FileCheck2 size={12} /> Verified</span> : <span className="inline-flex items-center gap-1 text-xs text-amber-700"><AlertTriangle size={12} /> Action needed</span>}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </Card>
        )}
        <p className="text-xs text-neutral-500">Every driver is KYC-verified at platform level. Your partner rating reflects your drivers' performance.</p>
      </div>
    </PartnerLayout>
  );
}
