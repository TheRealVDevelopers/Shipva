import { useState } from 'react';
import {
  Phone, Star, Plus, Truck as TruckIcon, FileCheck2, AlertTriangle, ShieldCheck,
  ShieldAlert, Pencil, Trash2, BadgeCheck,
} from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card } from '../../components/ui/Card.js';
import { Table, THead, Th, TBody, Tr, Td } from '../../components/ui/Table.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { DutyBadge } from '../../components/ui/StatusBadge.js';
import { VehicleArt } from '../../components/art.js';
import { Modal, Field, TextInput, DateInput, Select, Row } from '../../components/ui/Modal.js';
import { ImageUpload } from '../../components/ui/ImageUpload.js';
import { useStore } from '../../lib/store.js';
import { useAuth } from '../../lib/auth.js';
import { useNotify } from '../../lib/notify.js';
import { todayFullLabel } from '../../lib/format.js';
import {
  nameError, phoneError, aadhaarError, licenceError, panError, vehicleRegError,
  positiveError, normalizePhone, allClear,
} from '../../lib/validate.js';
import { isVerified, type FleetDriver, type Truck } from '../../lib/mocks.js';
import type { VehicleType } from '@shipva/shared-types';

const TABS = ['Drivers', 'Trucks'] as const;
const VEHICLE_TYPES: VehicleType[] = ['truck', 'pickup', 'tempo', 'mini_truck', 'reefer', 'auto', 'bike'];

/** A document only counts as on file when BOTH the number and the photo are
 *  present — that's what the client means by "with image upload". We report the
 *  number and the photo separately so "Aadhaar photo" reads differently from
 *  "Aadhaar" and nobody thinks a saved number has gone missing. */
interface DocSpec<T> { key: string; num: (r: T) => boolean; img: (r: T) => boolean }

const DRIVER_DOCS: DocSpec<FleetDriver>[] = [
  { key: 'Aadhaar', num: (d) => !!d.aadhaar, img: (d) => !!d.aadhaarImg },
  { key: 'Licence', num: (d) => !!d.licenseNo, img: (d) => !!d.licenseImg },
  { key: 'PAN', num: (d) => !!d.pan, img: (d) => !!d.panImg },
];
const TRUCK_DOCS: DocSpec<Truck>[] = [
  { key: 'RC', num: (t) => !!t.rc, img: (t) => !!t.rcImg },
  { key: 'Insurance', num: (t) => !!t.insuranceNo, img: (t) => !!t.insuranceImg },
  { key: 'Fitness', num: (t) => !!t.fitnessNo, img: (t) => !!t.fitnessImg },
];

function missingDocs<T>(specs: DocSpec<T>[], r: T): string[] {
  return specs.flatMap((s) => (!s.num(r) ? [s.key] : !s.img(r) ? [`${s.key} photo`] : []));
}
export const driverMissing = (d: FleetDriver): string[] => missingDocs(DRIVER_DOCS, d);
export const truckMissing = (t: Truck): string[] => missingDocs(TRUCK_DOCS, t);

const DRV_EMPTY = { name: '', phone: '', vehicleReg: '', vehicleType: 'truck' as VehicleType, aadhaar: '', licenseNo: '', pan: '' };
const TRK_EMPTY = { reg: '', type: 'truck' as VehicleType, capacityKg: '' };

export function Fleet() {
  const {
    drivers, trucks, addDriver, addTruck, setDriverDocs, setTruckDocs,
    updateDriver, updateTruck, deleteDriver, deleteTruck,
  } = useStore();
  const { member } = useAuth();
  const { push } = useNotify();
  const isAdmin = member?.role === 'owner' || member?.role === 'manager';

  const [tab, setTab] = useState<(typeof TABS)[number]>('Drivers');
  const [add, setAdd] = useState<null | 'driver' | 'truck'>(null);
  const [nd, setNd] = useState(DRV_EMPTY);
  const [nt, setNt] = useState(TRK_EMPTY);
  const [tried, setTried] = useState(false);

  // Modals hold only an id and look the record up in the live Firestore-backed
  // list — holding the object itself would freeze it at open time, so verifying
  // (or a teammate's edit) would never show up until the modal was reopened.
  const [docDriverId, setDocDriverId] = useState<string | null>(null);
  const docDriver = docDriverId ? drivers.find((d) => d.id === docDriverId) ?? null : null;
  const [dForm, setDForm] = useState<{
    aadhaar: string; licenseNo: string; licenseExpiry: string; pan: string;
    aadhaarImg?: string | undefined; licenseImg?: string | undefined; panImg?: string | undefined;
  }>({ aadhaar: '', licenseNo: '', licenseExpiry: '', pan: '' });
  const [docTruckId, setDocTruckId] = useState<string | null>(null);
  const docTruck = docTruckId ? trucks.find((t) => t.id === docTruckId) ?? null : null;
  const [tForm, setTForm] = useState<{
    rc: string; insuranceNo: string; insuranceExpiry: string; fitnessNo: string; fitnessExpiry: string;
    rcImg?: string | undefined; insuranceImg?: string | undefined; fitnessImg?: string | undefined;
  }>({ rc: '', insuranceNo: '', insuranceExpiry: '', fitnessNo: '', fitnessExpiry: '' });

  const [editDriverId, setEditDriverId] = useState<string | null>(null);
  const editDriver = editDriverId ? drivers.find((d) => d.id === editDriverId) ?? null : null;
  const [editTruckId, setEditTruckId] = useState<string | null>(null);
  const editTruck = editTruckId ? trucks.find((t) => t.id === editTruckId) ?? null : null;
  const [confirmDel, setConfirmDel] = useState<{ kind: 'driver' | 'truck'; id: string; label: string } | null>(null);

  const driversPending = drivers.filter((d) => driverMissing(d).length > 0).length;
  const trucksPending = trucks.filter((t) => truckMissing(t).length > 0).length;
  const trucksUnverified = trucks.filter((t) => !isVerified(t)).length;

  // ── New driver — the client requires Aadhaar, licence and PAN up front ──────
  const ndErrs = {
    name: nameError(nd.name, { label: 'Full name' }),
    phone: phoneError(nd.phone),
    vehicleReg: vehicleRegError(nd.vehicleReg, { required: false }),
    aadhaar: aadhaarError(nd.aadhaar),
    licenseNo: licenceError(nd.licenseNo),
    pan: panError(nd.pan),
  };
  function submitDriver() {
    setTried(true);
    if (!allClear(ndErrs)) return;
    addDriver({
      name: nd.name.trim(), phone: normalizePhone(nd.phone),
      vehicleReg: nd.vehicleReg.trim().toUpperCase(), vehicleType: nd.vehicleType,
      dutyStatus: 'offline', kycStatus: 'pending', ratingAvg: 0, tripsToday: 0,
      aadhaar: nd.aadhaar.trim(), licenseNo: nd.licenseNo.trim().toUpperCase(), pan: nd.pan.trim().toUpperCase(),
      verified: false, // explicit: absent means a legacy record, not a new one
    });
    setNd(DRV_EMPTY); setAdd(null); setTried(false);
    push({ title: 'Driver onboarded', body: `${nd.name.trim()} added — upload the document images next.`, tone: 'success' });
  }

  // ── New truck ───────────────────────────────────────────────────────────────
  const ntErrs = {
    reg: vehicleRegError(nt.reg),
    capacityKg: positiveError(nt.capacityKg, 'Capacity'),
  };
  function submitTruck() {
    setTried(true);
    if (!allClear(ntErrs)) return;
    addTruck({
      reg: nt.reg.trim().toUpperCase(), type: nt.type,
      capacityKg: Number(nt.capacityKg), status: 'available', docsOk: false,
      verified: false, // explicit: absent means a legacy record, not a new one
    });
    setNt(TRK_EMPTY); setAdd(null); setTried(false);
    push({ title: 'Truck added', body: `${nt.reg.trim().toUpperCase()} added — submit its documents to make it assignable.`, tone: 'success' });
  }

  function openDriverDocs(d: FleetDriver) {
    setDForm({
      aadhaar: d.aadhaar ?? '', licenseNo: d.licenseNo ?? '', licenseExpiry: d.licenseExpiry ?? '',
      pan: d.pan ?? '', aadhaarImg: d.aadhaarImg, licenseImg: d.licenseImg, panImg: d.panImg,
    });
    setDocDriverId(d.id);
  }
  function openTruckDocs(t: Truck) {
    setTForm({
      rc: t.rc ?? '', insuranceNo: t.insuranceNo ?? '', insuranceExpiry: t.insuranceExpiry ?? '',
      fitnessNo: t.fitnessNo ?? '', fitnessExpiry: t.fitnessExpiry ?? '',
      rcImg: t.rcImg, insuranceImg: t.insuranceImg, fitnessImg: t.fitnessImg,
    });
    setDocTruckId(t.id);
  }

  /** Owner/manager only: confirm the documents have been checked. */
  function verify(kind: 'driver' | 'truck', id: string, on: boolean) {
    const patch = on
      ? { verified: true, verifiedBy: member?.name ?? '', verifiedOn: todayFullLabel() }
      : { verified: false, verifiedBy: '', verifiedOn: '' };
    if (kind === 'driver') updateDriver(id, patch); else updateTruck(id, patch);
    push({
      title: on ? 'Documents verified' : 'Verification removed',
      body: on ? 'This record can now be assigned to trips.' : 'This record can no longer be assigned.',
      tone: on ? 'success' : 'warning',
    });
  }

  function doDelete() {
    if (!confirmDel) return;
    if (confirmDel.kind === 'driver') deleteDriver(confirmDel.id); else deleteTruck(confirmDel.id);
    push({ title: 'Deleted', body: `${confirmDel.label} removed.`, tone: 'info' });
    setConfirmDel(null);
  }

  /** Shared documents/verification cell. */
  function DocState({ missing, verified }: { missing: string[]; verified?: boolean | undefined }) {
    if (missing.length > 0) {
      return <div className="flex flex-wrap gap-1">{missing.map((m) => <Badge key={m} tone="danger">{m} pending</Badge>)}</div>;
    }
    return verified
      ? <Badge tone="success"><ShieldCheck size={11} /> Verified</Badge>
      : <Badge tone="warning"><ShieldAlert size={11} /> Awaiting verification</Badge>;
  }

  return (
    <PartnerLayout title="Trucks & Drivers" subtitle={`${drivers.length} drivers · ${trucks.length} trucks`}>
      <div className="space-y-4">
        {(driversPending > 0 || trucksPending > 0) && (
          <div className="flex items-center gap-2.5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-inset ring-amber-200">
            <AlertTriangle size={16} className="shrink-0 text-amber-500" />
            <span><b>{driversPending}</b> driver{driversPending === 1 ? '' : 's'} and <b>{trucksPending}</b> truck{trucksPending === 1 ? '' : 's'} have documents pending. Every document needs a number <i>and</i> a photo.</span>
          </div>
        )}
        {trucksPending === 0 && trucksUnverified > 0 && (
          <div className="flex items-center gap-2.5 rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-800 ring-1 ring-inset ring-sky-200">
            <ShieldAlert size={16} className="shrink-0 text-sky-500" />
            <span><b>{trucksUnverified}</b> truck{trucksUnverified === 1 ? '' : 's'} still need{trucksUnverified === 1 ? 's' : ''} verification before {trucksUnverified === 1 ? 'it' : 'they'} can be assigned to a trip. {isAdmin ? 'Open the documents and tick “Verified”.' : 'An owner or manager must verify them.'}</span>
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
          <Button size="sm" onClick={() => { setTried(false); setAdd(tab === 'Drivers' ? 'driver' : 'truck'); }}>
            <Plus size={12} /> {tab === 'Drivers' ? 'Onboard driver' : 'Add truck'}
          </Button>
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
                      <Td><div className="flex items-center gap-2"><VehicleArt type={d.vehicleType} className="h-6 w-9 shrink-0" /><span className="font-mono text-xs text-neutral-700">{d.vehicleReg || '—'}</span></div></Td>
                      <Td><DutyBadge status={d.dutyStatus} /></Td>
                      <Td><DocState missing={miss} verified={isVerified(d)} /></Td>
                      <Td>{d.ratingAvg > 0 ? <span className="inline-flex items-center gap-1 text-sm"><Star size={12} className="fill-amber-400 text-amber-400" /> {d.ratingAvg}</span> : <span className="text-xs text-neutral-400">new</span>}</Td>
                      <Td>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button size="sm" variant={miss.length ? 'primary' : 'secondary'} onClick={() => openDriverDocs(d)}>
                            {miss.length ? 'Provide docs' : 'View docs'}
                          </Button>
                          <button onClick={() => setEditDriverId(d.id)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-primary-600" title="Edit driver"><Pencil size={14} /></button>
                          {isAdmin && <button onClick={() => setConfirmDel({ kind: 'driver', id: d.id, label: d.name })} className="rounded-lg p-1.5 text-neutral-400 hover:bg-rose-50 hover:text-rose-600" title="Delete driver"><Trash2 size={14} /></button>}
                        </div>
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
                      <Td><DocState missing={miss} verified={isVerified(t)} /></Td>
                      <Td>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button size="sm" variant={miss.length ? 'primary' : 'secondary'} onClick={() => openTruckDocs(t)}>
                            {miss.length ? 'Submit docs' : 'View docs'}
                          </Button>
                          <button onClick={() => setEditTruckId(t.id)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-primary-600" title="Edit truck"><Pencil size={14} /></button>
                          {isAdmin && <button onClick={() => setConfirmDel({ kind: 'truck', id: t.id, label: t.reg })} className="rounded-lg p-1.5 text-neutral-400 hover:bg-rose-50 hover:text-rose-600" title="Delete truck"><Trash2 size={14} /></button>}
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
              </TBody>
            </Table>
          </Card>
        )}
        <p className="text-xs text-neutral-500">
          Every driver must provide Aadhaar, driving licence and PAN; every truck must submit RC, insurance and fitness certificate —
          each with a photo. A truck can only be put on a trip once an owner or manager has verified its documents.
        </p>
      </div>

      {/* Onboard driver */}
      <Modal open={add === 'driver'} onClose={() => setAdd(null)} title="Onboard driver" subtitle="Aadhaar, licence & PAN are required" onSubmit={submitDriver} submitLabel="Add driver" wide>
        {tried && !allClear(ndErrs) && (
          <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-100">
            Fill every field marked <span className="text-rose-500">*</span> to onboard this driver.
          </div>
        )}
        <Row>
          <Field label="Full name" required error={tried ? ndErrs.name : undefined}>
            <TextInput value={nd.name} onChange={(e) => setNd({ ...nd, name: e.target.value })} placeholder="Ramesh Yadav" />
          </Field>
          <Field label="Phone" required error={tried ? ndErrs.phone : undefined}>
            <TextInput inputMode="numeric" maxLength={10} value={nd.phone} onChange={(e) => setNd({ ...nd, phone: e.target.value })} placeholder="9876543210" />
          </Field>
        </Row>
        <Row>
          <Field label="Aadhaar" required error={tried ? ndErrs.aadhaar : undefined}>
            <TextInput inputMode="numeric" value={nd.aadhaar} onChange={(e) => setNd({ ...nd, aadhaar: e.target.value })} placeholder="4821 7745 9012" />
          </Field>
          <Field label="Driving licence" required error={tried ? ndErrs.licenseNo : undefined}>
            <TextInput value={nd.licenseNo} onChange={(e) => setNd({ ...nd, licenseNo: e.target.value.toUpperCase() })} placeholder="KA0120200012345" />
          </Field>
        </Row>
        <Row>
          <Field label="PAN" required error={tried ? ndErrs.pan : undefined}>
            <TextInput value={nd.pan} onChange={(e) => setNd({ ...nd, pan: e.target.value.toUpperCase() })} placeholder="ABCDE1234F" />
          </Field>
          <Field label="Vehicle type">
            <Select value={nd.vehicleType} onChange={(e) => setNd({ ...nd, vehicleType: e.target.value as VehicleType })}>
              {VEHICLE_TYPES.map((v) => <option key={v} value={v}>{v.replaceAll('_', ' ')}</option>)}
            </Select>
          </Field>
        </Row>
        <Field label="Vehicle number" hint="Optional" error={tried ? ndErrs.vehicleReg : undefined}>
          <TextInput value={nd.vehicleReg} onChange={(e) => setNd({ ...nd, vehicleReg: e.target.value.toUpperCase() })} placeholder="KA01AB1234" />
        </Field>
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-800 ring-1 ring-inset ring-amber-100">Upload the document photos next — the driver shows as pending until every document has both a number and a photo.</p>
      </Modal>

      {/* Add truck */}
      <Modal open={add === 'truck'} onClose={() => setAdd(null)} title="Add truck" subtitle="Documents are submitted next" onSubmit={submitTruck} submitLabel="Add truck">
        {tried && !allClear(ntErrs) && (
          <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-100">
            Fill every field marked <span className="text-rose-500">*</span> to add this truck.
          </div>
        )}
        <Field label="Registration no" required error={tried ? ntErrs.reg : undefined}>
          <TextInput value={nt.reg} onChange={(e) => setNt({ ...nt, reg: e.target.value.toUpperCase() })} placeholder="KA01AB1234" />
        </Field>
        <Row>
          <Field label="Type">
            <Select value={nt.type} onChange={(e) => setNt({ ...nt, type: e.target.value as VehicleType })}>
              {VEHICLE_TYPES.map((v) => <option key={v} value={v}>{v.replaceAll('_', ' ')}</option>)}
            </Select>
          </Field>
          <Field label="Capacity (kg)" required error={tried ? ntErrs.capacityKg : undefined}>
            <TextInput type="number" value={nt.capacityKg} onChange={(e) => setNt({ ...nt, capacityKg: e.target.value })} placeholder="7000" />
          </Field>
        </Row>
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-800 ring-1 ring-inset ring-amber-100">This truck can't be assigned to a trip until RC, insurance &amp; fitness are submitted and an owner/manager verifies them.</p>
      </Modal>

      {/* Driver documents */}
      <Modal open={!!docDriver} onClose={() => setDocDriverId(null)} title={`Documents · ${docDriver?.name ?? ''}`} subtitle="Aadhaar, driving licence & PAN"
        onSubmit={() => { if (docDriver) { setDriverDocs(docDriver.id, dForm); setDocDriverId(null); } }} submitLabel="Save documents" wide>
        <Field label="Aadhaar number" hint="12-digit UIDAI number"><TextInput value={dForm.aadhaar} onChange={(e) => setDForm({ ...dForm, aadhaar: e.target.value })} placeholder="4821 7745 9012" /></Field>
        <Field label="Aadhaar card image"><ImageUpload value={dForm.aadhaarImg} onChange={(v) => setDForm({ ...dForm, aadhaarImg: v })} label="Upload Aadhaar" path={`documents/drivers/${docDriver?.id}/aadhaar`} /></Field>
        <Row>
          <Field label="Driving licence no"><TextInput value={dForm.licenseNo} onChange={(e) => setDForm({ ...dForm, licenseNo: e.target.value.toUpperCase() })} placeholder="KA0120200012345" /></Field>
          <Field label="Licence expiry"><DateInput value={dForm.licenseExpiry} onChange={(v) => setDForm({ ...dForm, licenseExpiry: v })} /></Field>
        </Row>
        <Field label="Driving licence image"><ImageUpload value={dForm.licenseImg} onChange={(v) => setDForm({ ...dForm, licenseImg: v })} label="Upload licence" path={`documents/drivers/${docDriver?.id}/licence`} /></Field>
        <Field label="PAN number"><TextInput value={dForm.pan} onChange={(e) => setDForm({ ...dForm, pan: e.target.value.toUpperCase() })} placeholder="ABCDE1234F" /></Field>
        <Field label="PAN card image"><ImageUpload value={dForm.panImg} onChange={(v) => setDForm({ ...dForm, panImg: v })} label="Upload PAN" path={`documents/drivers/${docDriver?.id}/pan`} /></Field>
        {docDriver && <VerifyPanel record={docDriver} missing={driverMissing({ ...docDriver, ...dForm })} isAdmin={isAdmin} onVerify={(on) => verify('driver', docDriver.id, on)} />}
      </Modal>

      {/* Truck documents */}
      <Modal open={!!docTruck} onClose={() => setDocTruckId(null)} title={`Documents · ${docTruck?.reg ?? ''}`} subtitle="RC, insurance & fitness"
        onSubmit={() => { if (docTruck) { setTruckDocs(docTruck.id, tForm); setDocTruckId(null); } }} submitLabel="Save documents" wide>
        <Field label="RC number"><TextInput value={tForm.rc} onChange={(e) => setTForm({ ...tForm, rc: e.target.value.toUpperCase() })} placeholder="RC-KA01C5521" /></Field>
        <Field label="RC image"><ImageUpload value={tForm.rcImg} onChange={(v) => setTForm({ ...tForm, rcImg: v })} label="Upload RC" path={`documents/trucks/${docTruck?.id}/rc`} /></Field>
        <Row>
          <Field label="Insurance no"><TextInput value={tForm.insuranceNo} onChange={(e) => setTForm({ ...tForm, insuranceNo: e.target.value.toUpperCase() })} placeholder="INS-778812" /></Field>
          <Field label="Insurance expiry"><DateInput value={tForm.insuranceExpiry} onChange={(v) => setTForm({ ...tForm, insuranceExpiry: v })} /></Field>
        </Row>
        <Field label="Insurance image"><ImageUpload value={tForm.insuranceImg} onChange={(v) => setTForm({ ...tForm, insuranceImg: v })} label="Upload insurance" path={`documents/trucks/${docTruck?.id}/insurance`} /></Field>
        <Row>
          <Field label="Fitness cert no"><TextInput value={tForm.fitnessNo} onChange={(e) => setTForm({ ...tForm, fitnessNo: e.target.value.toUpperCase() })} placeholder="FIT-4521" /></Field>
          <Field label="Fitness expiry"><DateInput value={tForm.fitnessExpiry} onChange={(v) => setTForm({ ...tForm, fitnessExpiry: v })} /></Field>
        </Row>
        <Field label="Fitness certificate image"><ImageUpload value={tForm.fitnessImg} onChange={(v) => setTForm({ ...tForm, fitnessImg: v })} label="Upload fitness" path={`documents/trucks/${docTruck?.id}/fitness`} /></Field>
        {docTruck && <VerifyPanel record={docTruck} missing={truckMissing({ ...docTruck, ...tForm })} isAdmin={isAdmin} onVerify={(on) => verify('truck', docTruck.id, on)} />}
      </Modal>

      {/* Edit driver */}
      {editDriver && (
        <Modal open onClose={() => setEditDriverId(null)} title={`Edit · ${editDriver.name}`} subtitle="Details only — documents are managed separately"
          onSubmit={() => { setEditDriverId(null); }} submitLabel="Done">
          <EditDriverBody driver={editDriver} onSave={(patch) => updateDriver(editDriver.id, patch)} />
        </Modal>
      )}

      {/* Edit truck */}
      {editTruck && (
        <Modal open onClose={() => setEditTruckId(null)} title={`Edit · ${editTruck.reg}`} subtitle="Details only — documents are managed separately"
          onSubmit={() => { setEditTruckId(null); }} submitLabel="Done">
          <EditTruckBody truck={editTruck} onSave={(patch) => updateTruck(editTruck.id, patch)} />
        </Modal>
      )}

      {/* Delete confirmation */}
      {confirmDel && (
        <Modal open onClose={() => setConfirmDel(null)} title={`Delete ${confirmDel.label}?`} subtitle="This removes the record for everyone"
          onSubmit={doDelete} submitLabel="Delete">
          <p className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-800 ring-1 ring-inset ring-rose-100">
            <b>{confirmDel.label}</b> will be removed from the shared {confirmDel.kind === 'driver' ? 'driver' : 'truck'} list for the whole team. Trips already created keep their record. This can't be undone.
          </p>
        </Modal>
      )}
    </PartnerLayout>
  );
}

/** Verification block shown at the bottom of a documents modal. Only an
 *  owner/manager may tick it, and only once every document is on file. */
function VerifyPanel({ record, missing, isAdmin, onVerify }: {
  record: { verified?: boolean | undefined; verifiedBy?: string | undefined; verifiedOn?: string | undefined };
  missing: string[]; isAdmin: boolean; onVerify: (on: boolean) => void;
}) {
  const complete = missing.length === 0;
  if (isVerified(record)) {
    // A grandfathered record has no verifiedBy/On — say so plainly rather than
    // implying somebody checked it.
    const grandfathered = record.verified === undefined;
    return (
      <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2.5 text-xs ring-1 ring-inset ring-emerald-100">
        <span className="inline-flex items-center gap-1.5 font-bold text-emerald-800">
          <BadgeCheck size={14} />
          {grandfathered
            ? 'Allowed on trips — added before document checks; upload the papers when you can'
            : `Verified${record.verifiedBy ? ` by ${record.verifiedBy}` : ''}${record.verifiedOn ? ` · ${record.verifiedOn}` : ''}`}
        </span>
        {isAdmin && <button type="button" onClick={() => onVerify(false)} className="shrink-0 font-bold text-emerald-700 hover:underline">Remove verification</button>}
      </div>
    );
  }
  return (
    <div className="rounded-lg bg-sky-50 px-3 py-2.5 text-xs ring-1 ring-inset ring-sky-100">
      {!complete ? (
        <span className="text-sky-800">Still missing: <b>{missing.join(', ')}</b>. Save the number <i>and</i> a photo for each before this can be verified.</span>
      ) : isAdmin ? (
        <div className="flex items-center justify-between gap-3">
          <span className="text-sky-800">All documents are on file. Confirm you've checked them.</span>
          <button type="button" onClick={() => onVerify(true)} className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 font-bold text-white hover:bg-emerald-700">Mark verified</button>
        </div>
      ) : (
        <span className="text-sky-800">All documents are on file — an owner or manager needs to verify them.</span>
      )}
    </div>
  );
}

function EditDriverBody({ driver, onSave }: { driver: FleetDriver; onSave: (p: Partial<FleetDriver>) => void }) {
  const [name, setName] = useState(driver.name);
  const [phone, setPhone] = useState(driver.phone);
  const [vehicleReg, setVehicleReg] = useState(driver.vehicleReg);
  const [vehicleType, setVehicleType] = useState<VehicleType>(driver.vehicleType);
  const errs = {
    name: nameError(name, { label: 'Full name' }),
    phone: phoneError(phone),
    vehicleReg: vehicleRegError(vehicleReg, { required: false }),
  };
  const dirty = name !== driver.name || phone !== driver.phone || vehicleReg !== driver.vehicleReg || vehicleType !== driver.vehicleType;
  return (
    <div className="space-y-3.5">
      <Row>
        <Field label="Full name" required error={errs.name}><TextInput value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Phone" required error={errs.phone}><TextInput inputMode="numeric" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
      </Row>
      <Row>
        <Field label="Vehicle number" hint="Optional" error={errs.vehicleReg}><TextInput value={vehicleReg} onChange={(e) => setVehicleReg(e.target.value.toUpperCase())} /></Field>
        <Field label="Vehicle type">
          <Select value={vehicleType} onChange={(e) => setVehicleType(e.target.value as VehicleType)}>
            {VEHICLE_TYPES.map((v) => <option key={v} value={v}>{v.replaceAll('_', ' ')}</option>)}
          </Select>
        </Field>
      </Row>
      <button type="button" disabled={!dirty || !allClear(errs)}
        onClick={() => onSave({ name: name.trim(), phone: normalizePhone(phone), vehicleReg: vehicleReg.trim().toUpperCase(), vehicleType })}
        className="w-full rounded-lg bg-primary-500 py-2 text-xs font-bold text-white hover:bg-primary-600 disabled:opacity-40">
        Save changes
      </button>
    </div>
  );
}

function EditTruckBody({ truck, onSave }: { truck: Truck; onSave: (p: Partial<Truck>) => void }) {
  const [reg, setReg] = useState(truck.reg);
  const [type, setType] = useState<VehicleType>(truck.type);
  const [capacityKg, setCapacityKg] = useState(String(truck.capacityKg));
  const [status, setStatus] = useState(truck.status);
  const errs = { reg: vehicleRegError(reg), capacityKg: positiveError(capacityKg, 'Capacity') };
  const dirty = reg !== truck.reg || type !== truck.type || Number(capacityKg) !== truck.capacityKg || status !== truck.status;
  return (
    <div className="space-y-3.5">
      <Field label="Registration no" required error={errs.reg}><TextInput value={reg} onChange={(e) => setReg(e.target.value.toUpperCase())} /></Field>
      <Row>
        <Field label="Type">
          <Select value={type} onChange={(e) => setType(e.target.value as VehicleType)}>
            {VEHICLE_TYPES.map((v) => <option key={v} value={v}>{v.replaceAll('_', ' ')}</option>)}
          </Select>
        </Field>
        <Field label="Capacity (kg)" required error={errs.capacityKg}><TextInput type="number" value={capacityKg} onChange={(e) => setCapacityKg(e.target.value)} /></Field>
      </Row>
      <Field label="Status">
        <Select value={status} onChange={(e) => setStatus(e.target.value as Truck['status'])}>
          <option value="available">available</option><option value="on_trip">on trip</option><option value="maintenance">maintenance</option>
        </Select>
      </Field>
      <button type="button" disabled={!dirty || !allClear(errs)}
        onClick={() => onSave({ reg: reg.trim().toUpperCase(), type, capacityKg: Number(capacityKg), status })}
        className="w-full rounded-lg bg-primary-500 py-2 text-xs font-bold text-white hover:bg-primary-600 disabled:opacity-40">
        Save changes
      </button>
    </div>
  );
}
