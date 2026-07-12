import { useState } from 'react';
import { Plus, Download, MapPin, Trash2, FileSpreadsheet } from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card } from '../../components/ui/Card.js';
import { KpiCard } from '../../components/ui/KpiCard.js';
import { Table, THead, Th, TBody, Tr, Td } from '../../components/ui/Table.js';
import { Badge, type BadgeTone } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Modal, Field, TextInput, Select, Row } from '../../components/ui/Modal.js';
import { useStore, todayLabel, type TourStop } from '../../lib/store.js';
import { exportTourSheet } from '../../lib/exportTourSheet.js';

const STATUS = ['PLANNED', 'IN PROGRESS', 'COMPLETED', 'CANCELLED'];
const statusTone = (s: string): BadgeTone => s === 'COMPLETED' ? 'success' : s === 'CANCELLED' ? 'danger' : s === 'PLANNED' ? 'info' : 'primary';
const blankStop = (): TourStop => ({ name: '', amzArrival: '', kmPhoto: false, arrivalReport: '', amzDeparture: '', invoicePhoto: false, dispatchReport: '', km: '' });

const EMPTY = {
  date: '', tourId: '', vrId: '', toll: '', equipment: '10ft Truck',
  driver: '', vehicleId: '', driverNumber: '', vendorName: '',
  advanceAmount: '', status: 'PLANNED', present: 'PRESENT', scheduleAdhoc: 'SCHEDULE',
  noLoadLoad: 'Load', paidPending: 'Pending',
  totalManualKm: '', amazonRelyKm: '', gpsKm: '', remarks: '',
  stops: [blankStop(), blankStop()] as TourStop[],
};

export function Tours() {
  const { tours, drivers, trucks, attached, addTour } = useStore();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(EMPTY);

  const completed = tours.filter((t) => t.amzStatus === 'COMPLETED').length;
  const scheduled = tours.filter((t) => t.scheduleAdhoc === 'SCHEDULE').length;
  const advTotal = tours.reduce((s, t) => s + (Number(t.advanceAmount) || 0), 0);

  const set = (k: keyof typeof f, v: string) => setF({ ...f, [k]: v });
  const setStop = (i: number, k: keyof TourStop, v: string | boolean) =>
    setF({ ...f, stops: f.stops.map((s, idx) => (idx === i ? { ...s, [k]: v } : s)) });
  const addStop = () => f.stops.length < 4 && setF({ ...f, stops: [...f.stops, blankStop()] });
  const removeStop = (i: number) => setF({ ...f, stops: f.stops.filter((_, idx) => idx !== i) });

  function pickDriver(name: string) {
    const d = drivers.find((x) => x.name === name);
    setF({ ...f, driver: name, driverNumber: d?.phone ?? f.driverNumber, vehicleId: d?.vehicleReg ?? f.vehicleId });
  }

  const valid = f.tourId.trim() && f.driver.trim();
  function submit() {
    if (!valid) return;
    addTour({
      date: f.date || todayLabel(), tourId: f.tourId, vrId: f.vrId, seTracker: '', toll: f.toll,
      amzEquipmentType: f.equipment, seEquipmentType: f.equipment, amzStatus: f.status, sarvaStatus: f.status,
      present: f.present, scheduleAdhoc: f.scheduleAdhoc, noLoadLoad: f.noLoadLoad,
      advanceAmount: f.advanceAmount, paidPending: f.paidPending,
      driver: f.driver, vehicleId: f.vehicleId, driverNumber: f.driverNumber, vendorName: f.vendorName,
      stops: f.stops.filter((s) => s.name.trim()),
      totalManualKm: f.totalManualKm, amazonRelyKm: f.amazonRelyKm, gpsKm: f.gpsKm, remarks: f.remarks,
    });
    setF(EMPTY); setOpen(false);
  }

  return (
    <PartnerLayout title="Tours" subtitle="Amazon relay / line-haul tours — feeds your tour sheet">
      <div className="space-y-6">
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Tours" value={String(tours.length)} hint="on record" tone="primary" />
          <KpiCard label="Completed" value={String(completed)} hint="closed out" tone="success" />
          <KpiCard label="Scheduled" value={String(scheduled)} hint="planned runs" tone="primary" />
          <KpiCard label="Advance" value={`₹${advTotal.toLocaleString('en-IN')}`} hint="total" tone="accent" />
        </section>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-5 py-3">
            <h3 className="text-sm font-semibold text-neutral-800">Tour register</h3>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => exportTourSheet(tours)}><FileSpreadsheet size={13} /> Export sheet</Button>
              <Button size="sm" onClick={() => setOpen(true)}><Plus size={13} /> New tour</Button>
            </div>
          </div>
          <Table>
            <THead>
              <Tr><Th>Tour / Date</Th><Th>Facility sequence</Th><Th>Driver · Vehicle</Th><Th>Vendor</Th><Th>Status</Th><Th className="text-right">Advance</Th><Th className="text-right">Rely KM</Th></Tr>
            </THead>
            <TBody>
              {tours.map((t) => (
                <Tr key={t.id}>
                  <Td><div className="font-mono text-xs font-bold text-neutral-900">{t.tourId}</div><div className="text-[11px] text-neutral-400">{t.date}</div></Td>
                  <Td className="text-neutral-700"><span className="inline-flex items-center gap-1"><MapPin size={11} className="text-primary-500" />{t.stops.map((s) => s.name).filter(Boolean).join(' → ')}</span></Td>
                  <Td><div className="font-semibold text-neutral-800">{t.driver}</div><div className="font-mono text-[11px] text-neutral-400">{t.vehicleId}</div></Td>
                  <Td className="text-neutral-600">{t.vendorName || '—'}</Td>
                  <Td><Badge tone={statusTone(t.amzStatus)}>{t.amzStatus}</Badge></Td>
                  <Td className="text-right font-bold text-neutral-900">{t.advanceAmount ? `₹${Number(t.advanceAmount).toLocaleString('en-IN')}` : '—'}</Td>
                  <Td className="text-right text-neutral-700">{t.amazonRelyKm || '—'}</Td>
                </Tr>
              ))}
              {tours.length === 0 && <Tr><Td className="py-8 text-center text-sm text-neutral-400">No tours yet — add one.</Td></Tr>}
            </TBody>
          </Table>
        </Card>

        <p className="text-xs text-neutral-500">Each tour maps 1:1 to your 55-column Amazon tour sheet. Fill it here and it exports fully formatted from Data Export or the button above.</p>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New tour" subtitle="Amazon relay tour — feeds the tour sheet" onSubmit={submit} submitLabel="Save tour" submitDisabled={!valid}>
        <Row>
          <Field label="Date"><TextInput value={f.date} onChange={(e) => set('date', e.target.value)} placeholder={todayLabel()} /></Field>
          <Field label="Tour ID"><TextInput value={f.tourId} onChange={(e) => set('tourId', e.target.value)} placeholder="T-30FPN1321" /></Field>
        </Row>
        <Row>
          <Field label="VR ID"><TextInput value={f.vrId} onChange={(e) => set('vrId', e.target.value)} placeholder="112ZJHBB9" /></Field>
          <Field label="Equipment type"><TextInput value={f.equipment} onChange={(e) => set('equipment', e.target.value)} placeholder="10ft Truck" /></Field>
        </Row>
        <Row>
          <Field label="Driver">
            <Select value={f.driver} onChange={(e) => pickDriver(e.target.value)}>
              <option value="">Select driver</option>
              {drivers.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
            </Select>
          </Field>
          <Field label="Vehicle ID">
            <Select value={f.vehicleId} onChange={(e) => set('vehicleId', e.target.value)}>
              <option value="">Select vehicle</option>
              {trucks.map((t) => <option key={t.id} value={t.reg}>{t.reg}</option>)}
            </Select>
          </Field>
        </Row>
        <Row>
          <Field label="Driver number"><TextInput value={f.driverNumber} onChange={(e) => set('driverNumber', e.target.value)} placeholder="85536 39858" /></Field>
          <Field label="Vendor">
            <Select value={f.vendorName} onChange={(e) => set('vendorName', e.target.value)}>
              <option value="">— none —</option>
              {attached.map((a) => <option key={a.id} value={a.owner}>{a.owner}</option>)}
            </Select>
          </Field>
        </Row>
        <Row>
          <Field label="Status"><Select value={f.status} onChange={(e) => set('status', e.target.value)}>{STATUS.map((s) => <option key={s} value={s}>{s}</option>)}</Select></Field>
          <Field label="Advance amount (₹)"><TextInput type="number" value={f.advanceAmount} onChange={(e) => set('advanceAmount', e.target.value)} placeholder="2500" /></Field>
        </Row>
        <Row>
          <Field label="Schedule / Adhoc"><Select value={f.scheduleAdhoc} onChange={(e) => set('scheduleAdhoc', e.target.value)}><option>SCHEDULE</option><option>ADHOC</option></Select></Field>
          <Field label="Load"><Select value={f.noLoadLoad} onChange={(e) => set('noLoadLoad', e.target.value)}><option>Load</option><option>No Load</option></Select></Field>
        </Row>
        <Row>
          <Field label="Present"><Select value={f.present} onChange={(e) => set('present', e.target.value)}><option>PRESENT</option><option>Absent</option></Select></Field>
          <Field label="Paid / Pending"><Select value={f.paidPending} onChange={(e) => set('paidPending', e.target.value)}><option>Pending</option><option>Paid</option></Select></Field>
        </Row>

        {/* Stops */}
        <div className="rounded-lg bg-neutral-50 p-3 ring-1 ring-inset ring-neutral-200">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-700">Stops ({f.stops.length}/4)</span>
            {f.stops.length < 4 && <button type="button" onClick={addStop} className="text-xs font-bold text-primary-600 hover:text-primary-700">+ Add stop</button>}
          </div>
          <div className="space-y-3">
            {f.stops.map((s, i) => (
              <div key={i} className="rounded-lg bg-white p-2.5 ring-1 ring-inset ring-neutral-200">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-neutral-500">Stop {i + 1}</span>
                  {f.stops.length > 1 && <button type="button" onClick={() => removeStop(i)} className="text-neutral-400 hover:text-rose-500"><Trash2 size={13} /></button>}
                </div>
                <Row>
                  <Field label="Facility"><TextInput value={s.name} onChange={(e) => setStop(i, 'name', e.target.value)} placeholder="HKA3" /></Field>
                  <Field label="KM"><TextInput value={s.km} onChange={(e) => setStop(i, 'km', e.target.value)} placeholder="42" /></Field>
                </Row>
                <Row>
                  <Field label="AMZ arrival"><TextInput value={s.amzArrival} onChange={(e) => setStop(i, 'amzArrival', e.target.value)} placeholder="07:00" /></Field>
                  <Field label="AMZ departure"><TextInput value={s.amzDeparture} onChange={(e) => setStop(i, 'amzDeparture', e.target.value)} placeholder="09:30" /></Field>
                </Row>
                <div className="mt-1 flex flex-wrap gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-neutral-600"><input type="checkbox" checked={s.kmPhoto} onChange={(e) => setStop(i, 'kmPhoto', e.target.checked)} /> KM photo</label>
                  <label className="flex items-center gap-1.5 text-xs text-neutral-600"><input type="checkbox" checked={s.invoicePhoto} onChange={(e) => setStop(i, 'invoicePhoto', e.target.checked)} /> Invoice photo</label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Row>
          <Field label="Total manual KM"><TextInput value={f.totalManualKm} onChange={(e) => set('totalManualKm', e.target.value)} placeholder="82" /></Field>
          <Field label="Amazon Rely KM"><TextInput value={f.amazonRelyKm} onChange={(e) => set('amazonRelyKm', e.target.value)} placeholder="80" /></Field>
        </Row>
        <Row>
          <Field label="GPS KM"><TextInput value={f.gpsKm} onChange={(e) => set('gpsKm', e.target.value)} placeholder="84" /></Field>
          <Field label="Toll"><TextInput value={f.toll} onChange={(e) => set('toll', e.target.value)} placeholder="120" /></Field>
        </Row>
        <Field label="Remarks"><TextInput value={f.remarks} onChange={(e) => set('remarks', e.target.value)} placeholder="On schedule" /></Field>
      </Modal>
    </PartnerLayout>
  );
}
