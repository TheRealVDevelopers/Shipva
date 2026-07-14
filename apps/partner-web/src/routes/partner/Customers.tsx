import { useState } from 'react';
import { Plus, Phone, Building2, Receipt, FileText, FileWarning, Download } from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card } from '../../components/ui/Card.js';
import { KpiCard } from '../../components/ui/KpiCard.js';
import { Table, THead, Th, TBody, Tr, Td } from '../../components/ui/Table.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Modal, Field, TextInput, DateInput, Row } from '../../components/ui/Modal.js';
import { rupees } from '../../lib/format.js';
import { useStore, todayLabel, type Customer } from '../../lib/store.js';
import { printAgreement } from '../../lib/agreement.js';
import { printJoiningLetter } from '../../lib/joiningLetter.js';

const EMPTY = { name: '', gstin: '', phone: '', city: '', rate: '' };
const AG_EMPTY = { effectiveFrom: '', durationMonths: '12', rate: '', notes: '' };

export function Customers() {
  const { customers, addCustomer, setCustomerAgreement } = useStore();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(EMPTY);
  const [agFor, setAgFor] = useState<Customer | null>(null);
  const [ag, setAg] = useState(AG_EMPTY);

  const outstanding = customers.reduce((s, c) => s + c.outstandingPaise, 0);
  const noAgreement = customers.filter((c) => !c.agreement).length;
  const valid = f.name.trim().length > 0;

  function submit() {
    if (!valid) return;
    addCustomer({ name: f.name, gstin: f.gstin, phone: f.phone, city: f.city, ratePerKmPaise: Math.round(Number(f.rate || '0') * 100) });
    setF(EMPTY); setOpen(false);
  }

  function openAgreement(c: Customer) {
    setAg({ effectiveFrom: todayLabel(), durationMonths: '12', rate: c.ratePerKmPaise ? String(c.ratePerKmPaise / 100) : '', notes: '' });
    setAgFor(c);
  }
  function saveAgreement(download: boolean) {
    if (!agFor) return;
    const agreement = {
      createdOn: todayLabel(), effectiveFrom: ag.effectiveFrom || todayLabel(),
      durationMonths: Number(ag.durationMonths) || 12,
      ...(ag.rate ? { ratePerKmPaise: Math.round(Number(ag.rate) * 100) } : {}),
      ...(ag.notes ? { notes: ag.notes } : {}),
    };
    setCustomerAgreement(agFor.id, agreement);
    if (download) printAgreement('customer', { name: agFor.name, gstin: agFor.gstin, place: agFor.city, phone: agFor.phone }, agreement);
    setAgFor(null);
  }

  return (
    <PartnerLayout title="Transporters" subtitle="Consignors, agreements, rate contracts & dues">
      <div className="space-y-6">
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Transporters" value={String(customers.length)} hint="on file" tone="primary" icon={<Building2 size={14} />} />
          <KpiCard label="Agreements pending" value={String(noAgreement)} hint="not created yet" tone="danger" icon={<FileWarning size={14} />} />
          <KpiCard label="Total dues" value={rupees(outstanding)} hint="receivable" tone="accent" />
          <KpiCard label="Rate contracts" value={String(customers.filter((c) => c.ratePerKmPaise > 0).length)} hint="agreed ₹/km" tone="success" icon={<Receipt size={14} />} />
        </section>

        <Card>
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3">
            <h3 className="text-sm font-semibold text-neutral-800">Transporter directory</h3>
            <Button size="sm" onClick={() => setOpen(true)}><Plus size={13} /> Add transporter</Button>
          </div>
          <Table>
            <THead>
              <Tr><Th>Company</Th><Th>GSTIN</Th><Th>City</Th><Th className="text-right">Rate ₹/km</Th><Th className="text-right">Outstanding</Th><Th>Agreement</Th><Th></Th></Tr>
            </THead>
            <TBody>
              {customers.map((c) => (
                <Tr key={c.id}>
                  <Td>
                    <div className="font-semibold text-neutral-900">{c.name}</div>
                    <div className="flex items-center gap-1 text-[11px] text-neutral-400"><Phone size={10} /> {c.phone}</div>
                  </Td>
                  <Td className="font-mono text-[11px] text-neutral-500">{c.gstin || '—'}</Td>
                  <Td className="text-neutral-600">{c.city || '—'}</Td>
                  <Td className="text-right text-neutral-700">{c.ratePerKmPaise ? rupees(c.ratePerKmPaise) : '—'}</Td>
                  <Td className="text-right">
                    {c.outstandingPaise > 0
                      ? <span className="font-bold text-rose-600">{rupees(c.outstandingPaise)}</span>
                      : <Badge tone="success">Clear</Badge>}
                  </Td>
                  <Td>
                    {c.agreement
                      ? <Badge tone="success"><FileText size={11} /> Active · {c.agreement.createdOn}</Badge>
                      : <Badge tone="danger"><FileWarning size={11} /> Not created</Badge>}
                  </Td>
                  <Td>
                    <div className="flex items-center justify-end gap-3">
                      {c.agreement
                        ? <button onClick={() => printAgreement('customer', { name: c.name, gstin: c.gstin, place: c.city, phone: c.phone }, c.agreement!)} className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-700"><Download size={12} /> Agreement</button>
                        : <Button size="sm" onClick={() => openAgreement(c)}>Create agreement</Button>}
                      <button onClick={() => printJoiningLetter({ name: c.name, place: c.city, phone: c.phone })} className="text-xs font-bold text-neutral-500 hover:text-primary-600" title="Trial joining letter (LOI)">LOI</button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Card>
      </div>

      {/* Add transporter */}
      <Modal open={open} onClose={() => setOpen(false)} title="Add transporter" subtitle="A consignor you bill" onSubmit={submit} submitLabel="Add transporter" submitDisabled={!valid}>
        <Field label="Company name"><TextInput value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Bharat Steels" /></Field>
        <Row>
          <Field label="GSTIN"><TextInput value={f.gstin} onChange={(e) => setF({ ...f, gstin: e.target.value })} placeholder="29ABCDE1234F1Z5" /></Field>
          <Field label="City"><TextInput value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} placeholder="Hosur" /></Field>
        </Row>
        <Row>
          <Field label="Phone"><TextInput value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="+91 98450 10001" /></Field>
          <Field label="Rate (₹/km)" hint="Optional rate contract"><TextInput type="number" value={f.rate} onChange={(e) => setF({ ...f, rate: e.target.value })} placeholder="42" /></Field>
        </Row>
      </Modal>

      {/* Create agreement */}
      <Modal open={!!agFor} onClose={() => setAgFor(null)} title={`Agreement · ${agFor?.name ?? ''}`} subtitle="Fill the terms, then download"
        onSubmit={() => saveAgreement(true)} submitLabel="Create & download">
        <Row>
          <Field label="Effective from" required><DateInput value={ag.effectiveFrom} onChange={(v) => setAg({ ...ag, effectiveFrom: v })} /></Field>
          <Field label="Duration (months)"><TextInput type="number" value={ag.durationMonths} onChange={(e) => setAg({ ...ag, durationMonths: e.target.value })} placeholder="12" /></Field>
        </Row>
        <Field label="Freight rate (₹/km)" hint="Optional"><TextInput type="number" value={ag.rate} onChange={(e) => setAg({ ...ag, rate: e.target.value })} placeholder="42" /></Field>
        <Field label="Special terms" hint="Optional"><TextInput value={ag.notes} onChange={(e) => setAg({ ...ag, notes: e.target.value })} placeholder="Monthly billing, 30-day credit" /></Field>
        <div className="flex items-center justify-between rounded-lg bg-primary-50 px-3 py-2 text-[11px] text-primary-800 ring-1 ring-inset ring-primary-100">
          <span>Generates a PDF you can print &amp; sign.</span>
          <button type="button" onClick={() => saveAgreement(false)} className="font-bold text-primary-700 hover:underline">Save without download</button>
        </div>
      </Modal>
    </PartnerLayout>
  );
}
