import { useState } from 'react';
import { Phone, Star, Plus, Truck as TruckIcon, FileCheck2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card } from '../../components/ui/Card.js';
import { Table, THead, Th, TBody, Tr, Td } from '../../components/ui/Table.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { DutyBadge } from '../../components/ui/StatusBadge.js';
import { VehicleArt } from '../../components/art.js';
import { Modal, Field, TextInput, Select, Row } from '../../components/ui/Modal.js';
import { ImageUpload } from '../../components/ui/ImageUpload.js';
import { useStore } from '../../lib/store.js';
import type { FleetDriver, Truck } from '../../lib/mocks.js';
import type { VehicleType } from '@shipva/shared-types';

const TABS = ['Drivers', 'Trucks'] as const;
const VEHICLE_TYPES: VehicleType[] = ['truck', 'pickup', 'tempo', 'mini_truck', 'reefer', 'auto', 'bike'];

function driverMissing(d: FleetDriver): string[] {
  const m: string[] = [];
  if (!d.aadhaar) m.push('Aadhaar');
  if (!d.licenseNo) m.push('Licence');
  return m;
}
function truckMissing(t: Truck): string[] {
  const m: string[] = [];
  if (!t.rc) m.push('RC');
  if (!t.insuranceNo) m.push('Insurance');
  if (!t.fitnessNo) m.push('Fitness');
  return m;
}

const DRV_EMPTY = { name: '', phone: '', vehicleReg: '', vehicleType: 'truck' as VehicleType };
const TRK_EMPTY = { reg: '', type: 'truck' as VehicleType, capacityKg: '' };

export function Fleet() {
  const { drivers, trucks, addDriver, addTruck, setDriverDocs, setTruckDocs } = useStore();
  const [tab, setTab] = useState<(typeof TABS)[number]>('Drivers');
  const [add, setAdd] = useState<null | 'driver' | 'truck'>(null);
  const [nd, setNd] = useState(DRV_EMPTY);
  const [nt, setNt] = useState(TRK_EMPTY);

  const [docDriver, setDocDriver] = useState<FleetDriver | null>(null);
  const [dForm, setDForm] = useState<{ aadhaar: string; licenseNo: string; licenseExpiry: string; aadhaarImg?: string | undefined; licenseImg?: string | undefined }>({ aadhaar: '', licenseNo: '', licenseExpiry: '' });
  const [docTruck, setDocTruck] = useState<Truck | null>(null);
  const [tForm, setTForm] = useState<{ rc: string; insuranceNo: string; insuranceExpiry: string; fitnessNo: string; fitnessExpiry: string; rcImg?: string | undefined; insuranceImg?: string | undefined; fitnessImg?: string | undefined }>({ rc: '', insuranceNo: '', insuranceExpiry: '', fitnessNo: '', fitnessExpiry: '' });

  const driversPending = drivers.filter((d) => driverMissing(d).length > 0).length;
  const trucksPending = trucks.filter((t) => truckMissing(t).length > 0).length;

  function openDriverDocs(d: FleetDriver) {
    setDForm({ aadhaar: d.aadhaar ?? '', licenseNo: d.licenseNo ?? '', licenseExpiry: d.licenseExpiry ?? '', aadhaarImg: d.aadhaarImg, licenseImg: d.licenseImg });
    setDocDriver(d);
  }
  function openTruckDocs(t: Truck) {
    setTForm({ rc: t.rc ?? '', insuranceNo: t.insuranceNo ?? '', insuranceExpiry: t.insuranceExpiry ?? '', fitnessNo: t.fitnessNo ?? '', fitnessExpiry: t.fitnessExpiry ?? '', rcImg: t.rcImg, insuranceImg: t.insuranceImg, fitnessImg: t.fitnessImg });
    setDocTruck(t);
  }

  return (
    <PartnerLayout title="Trucks & Drivers" subtitle={`${drivers.length} drivers · ${trucks.length} trucks`}>
      <div className="space-y-4">
        {(driversPending > 0 || trucksPending > 0) && (
          <div className="flex items-center gap-2.5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-inset ring-amber-200">
            <AlertTriangle size={16} className="shrink-0 text-amber-500" />
            <span><b>{driversPending}</b> driver{driversPending === 1 ? '' : 's'} and <b>{trucksPending}</b> truck{trucksPending === 1 ? '' : 's'} have documents pending. Provide them to stay compliant.</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`rounded-lg px-4 py-1.5 text-xs font-bold ${tab === t ? 'bg-primary-500 text-white' : 'bg-white text-neutral-700 ring-1 ring-inset ring-neutral-200'}`}>
                {t}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={() => setAdd(tab === 'Drivers' ? 'driver' : 'truck')}><Plus size={12} /> {tab === 'Drivers' ? 'Onboard driver' : 'Add truck'}</Button>
        </div>

        {tab === 'Drivers' ? (
          <Card>
            <Table>
              <THead><Tr><Th>Driver</Th><Th>Vehicle</Th><Th>Duty</Th><Th>Documents</Th><Th>Rating</Th><Th></Th></Tr></THead>
              <TBody>
                {drivers.map((d) => {
                  const miss = driverMissing(d);
                  return (
                    <Tr key={d.id}>
                      <Td>
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">{d.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}</span>
                          <div><div className="font-bold text-neutral-900">{d.name}</div><div className="flex items-center gap-1 text-xs text-neutral-500"><Phone size={10} /> {d.phone}</div></div>
                        </div>
                      </Td>
                      <Td><div className="flex items-center gap-2"><VehicleArt type={d.vehicleType} className="h-6 w-9 shrink-0" /><span className="font-mono text-xs text-neutral-700">{d.vehicleReg}</span></div></Td>
                      <Td><DutyBadge status={d.dutyStatus} /></Td>
                      <Td>
                        {miss.length === 0
                          ? <Badge tone="success"><ShieldCheck size={11} /> Verified</Badge>
                          : <div className="flex flex-wrap gap-1">{miss.map((m) => <Badge key={m} tone="danger">{m} not provided</Badge>)}</div>}
                      </Td>
                      <Td>{d.ratingAvg > 0 ? <span className="inline-flex items-center gap-1 text-sm"><Star size={12} className="fill-amber-400 text-amber-400" /> {d.ratingAvg}</span> : <span className="text-xs text-neutral-400">new</span>}</Td>
                      <Td>
                        <Button size="sm" variant={miss.length ? 'primary' : 'secondary'} onClick={() => openDriverDocs(d)}>
                          {miss.length ? 'Provide docs' : 'View docs'}
                        </Button>
                      </Td>
                    </Tr>
                  );
                })}
              </TBody>
            </Table>
          </Card>
        ) : (
          <Card>
            <Table>
              <THead><Tr><Th>Truck</Th><Th>Type</Th><Th>Capacity</Th><Th>Status</Th><Th>Documents</Th><Th></Th></Tr></THead>
              <TBody>
                {trucks.map((t) => {
                  const miss = truckMissing(t);
                  return (
                    <Tr key={t.id}>
                      <Td><div className="flex items-center gap-2"><VehicleArt type={t.type} className="h-7 w-10 shrink-0" /><span className="font-mono text-xs font-bold text-neutral-900">{t.reg}</span></div></Td>
                      <Td className="capitalize text-neutral-700">{t.type.replaceAll('_', ' ')}</Td>
                      <Td className="text-neutral-700">{t.capacityKg.toLocaleString('en-IN')} kg</Td>
                      <Td><Badge tone={t.status === 'available' ? 'success' : t.status === 'on_trip' ? 'info' : 'warning'}><TruckIcon size={10} /> {t.status.replaceAll('_', ' ')}</Badge></Td>
                      <Td>
                        {miss.length === 0
                          ? <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700"><FileCheck2 size={12} /> All submitted</span>
                          : <div className="flex flex-wrap gap-1">{miss.map((m) => <Badge key={m} tone="danger">{m} not submitted</Badge>)}</div>}
                      </Td>
                      <Td>
                        <Button size="sm" variant={miss.length ? 'primary' : 'secondary'} onClick={() => openTruckDocs(t)}>
                          {miss.length ? 'Submit docs' : 'View docs'}
                        </Button>
                      </Td>
                    </Tr>
                  );
                })}
              </TBody>
            </Table>
          </Card>
        )}
        <p className="text-xs text-neutral-500">Every driver must provide Aadhaar and driving licence; every truck must submit RC, insurance and fitness certificate.</p>
      </div>

      {/* Onboard driver */}
      <Modal open={add === 'driver'} onClose={() => setAdd(null)} title="Onboard driver" subtitle="Documents can be added after"
        onSubmit={() => { if (nd.name && nd.phone) { addDriver({ ...nd, dutyStatus: 'offline', kycStatus: 'pending', ratingAvg: 0, tripsToday: 0 }); setNd(DRV_EMPTY); setAdd(null); } }}
        submitLabel="Add driver" submitDisabled={!(nd.name && nd.phone)}>
        <Row>
          <Field label="Full name"><TextInput value={nd.name} onChange={(e) => setNd({ ...nd, name: e.target.value })} placeholder="Ramesh Yadav" /></Field>
          <Field label="Phone"><TextInput value={nd.phone} onChange={(e) => setNd({ ...nd, phone: e.target.value })} placeholder="+91 99020 51001" /></Field>
        </Row>
        <Row>
          <Field label="Vehicle reg"><TextInput value={nd.vehicleReg} onChange={(e) => setNd({ ...nd, vehicleReg: e.target.value })} placeholder="KA01C5521" /></Field>
          <Field label="Vehicle type">
            <Select value={nd.vehicleType} onChange={(e) => setNd({ ...nd, vehicleType: e.target.value as VehicleType })}>
              {VEHICLE_TYPES.map((v) => <option key={v} value={v}>{v.replaceAll('_', ' ')}</option>)}
            </Select>
          </Field>
        </Row>
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-800 ring-1 ring-inset ring-amber-100">Until Aadhaar &amp; licence are provided, this driver will show as documents pending.</p>
      </Modal>

      {/* Add truck */}
      <Modal open={add === 'truck'} onClose={() => setAdd(null)} title="Add truck" subtitle="Documents can be submitted after"
        onSubmit={() => { if (nt.reg) { addTruck({ reg: nt.reg, type: nt.type, capacityKg: Number(nt.capacityKg) || 0, status: 'available', docsOk: false }); setNt(TRK_EMPTY); setAdd(null); } }}
        submitLabel="Add truck" submitDisabled={!nt.reg}>
        <Field label="Registration no"><TextInput value={nt.reg} onChange={(e) => setNt({ ...nt, reg: e.target.value })} placeholder="KA01C5521" /></Field>
        <Row>
          <Field label="Type">
            <Select value={nt.type} onChange={(e) => setNt({ ...nt, type: e.target.value as VehicleType })}>
              {VEHICLE_TYPES.map((v) => <option key={v} value={v}>{v.replaceAll('_', ' ')}</option>)}
            </Select>
          </Field>
          <Field label="Capacity (kg)"><TextInput type="number" value={nt.capacityKg} onChange={(e) => setNt({ ...nt, capacityKg: e.target.value })} placeholder="7000" /></Field>
        </Row>
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-800 ring-1 ring-inset ring-amber-100">Until RC, insurance &amp; fitness are submitted, this truck will show as documents pending.</p>
      </Modal>

      {/* Driver documents */}
      <Modal open={!!docDriver} onClose={() => setDocDriver(null)} title={`Documents · ${docDriver?.name ?? ''}`} subtitle="Aadhaar & driving licence"
        onSubmit={() => { if (docDriver) { setDriverDocs(docDriver.id, dForm); setDocDriver(null); } }} submitLabel="Save documents">
        <Field label="Aadhaar number" hint="12-digit UIDAI number"><TextInput value={dForm.aadhaar} onChange={(e) => setDForm({ ...dForm, aadhaar: e.target.value })} placeholder="4821 7745 9012" /></Field>
        <Field label="Aadhaar card image"><ImageUpload value={dForm.aadhaarImg} onChange={(v) => setDForm({ ...dForm, aadhaarImg: v })} label="Upload Aadhaar" /></Field>
        <Row>
          <Field label="Driving licence no"><TextInput value={dForm.licenseNo} onChange={(e) => setDForm({ ...dForm, licenseNo: e.target.value })} placeholder="KA0120200012345" /></Field>
          <Field label="Licence expiry"><TextInput value={dForm.licenseExpiry} onChange={(e) => setDForm({ ...dForm, licenseExpiry: e.target.value })} placeholder="14 Aug 2031" /></Field>
        </Row>
        <Field label="Driving licence image"><ImageUpload value={dForm.licenseImg} onChange={(v) => setDForm({ ...dForm, licenseImg: v })} label="Upload licence" /></Field>
        <p className="text-[11px] text-neutral-400">Numbers are kept for reference; the image is the actual document. Full-resolution storage arrives with the backend.</p>
      </Modal>

      {/* Truck documents */}
      <Modal open={!!docTruck} onClose={() => setDocTruck(null)} title={`Documents · ${docTruck?.reg ?? ''}`} subtitle="RC, insurance & fitness"
        onSubmit={() => { if (docTruck) { setTruckDocs(docTruck.id, tForm); setDocTruck(null); } }} submitLabel="Save documents">
        <Field label="RC number"><TextInput value={tForm.rc} onChange={(e) => setTForm({ ...tForm, rc: e.target.value })} placeholder="RC-KA01C5521" /></Field>
        <Field label="RC image"><ImageUpload value={tForm.rcImg} onChange={(v) => setTForm({ ...tForm, rcImg: v })} label="Upload RC" /></Field>
        <Row>
          <Field label="Insurance no"><TextInput value={tForm.insuranceNo} onChange={(e) => setTForm({ ...tForm, insuranceNo: e.target.value })} placeholder="INS-778812" /></Field>
          <Field label="Insurance expiry"><TextInput value={tForm.insuranceExpiry} onChange={(e) => setTForm({ ...tForm, insuranceExpiry: e.target.value })} placeholder="02 Sep 2026" /></Field>
        </Row>
        <Field label="Insurance image"><ImageUpload value={tForm.insuranceImg} onChange={(v) => setTForm({ ...tForm, insuranceImg: v })} label="Upload insurance" /></Field>
        <Row>
          <Field label="Fitness cert no"><TextInput value={tForm.fitnessNo} onChange={(e) => setTForm({ ...tForm, fitnessNo: e.target.value })} placeholder="FIT-4521" /></Field>
          <Field label="Fitness expiry"><TextInput value={tForm.fitnessExpiry} onChange={(e) => setTForm({ ...tForm, fitnessExpiry: e.target.value })} placeholder="30 Jul 2026" /></Field>
        </Row>
        <Field label="Fitness certificate image"><ImageUpload value={tForm.fitnessImg} onChange={(v) => setTForm({ ...tForm, fitnessImg: v })} label="Upload fitness" /></Field>
        <p className="text-[11px] text-neutral-400">Numbers are kept for reference; the image is the actual document.</p>
      </Modal>
    </PartnerLayout>
  );
}
