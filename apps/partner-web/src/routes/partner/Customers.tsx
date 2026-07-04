import { useState } from 'react';
import { Plus, Phone, Building2, Receipt } from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card } from '../../components/ui/Card.js';
import { KpiCard } from '../../components/ui/KpiCard.js';
import { Table, THead, Th, TBody, Tr, Td } from '../../components/ui/Table.js';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Modal, Field, TextInput, Row } from '../../components/ui/Modal.js';
import { rupees } from '../../lib/format.js';
import { useStore } from '../../lib/store.js';

const EMPTY = { name: '', gstin: '', phone: '', city: '', rate: '' };

export function Customers() {
  const { customers, addCustomer } = useStore();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(EMPTY);

  const outstanding = customers.reduce((s, c) => s + c.outstandingPaise, 0);
  const withDues = customers.filter((c) => c.outstandingPaise > 0).length;
  const valid = f.name.trim().length > 0;

  function submit() {
    if (!valid) return;
    addCustomer({ name: f.name, gstin: f.gstin, phone: f.phone, city: f.city, ratePerKmPaise: Math.round(Number(f.rate || '0') * 100) });
    setF(EMPTY); setOpen(false);
  }

  return (
    <PartnerLayout title="Customers" subtitle="Consignors, rate contracts & dues">
      <div className="space-y-6">
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Customers" value={String(customers.length)} hint="on file" tone="primary" icon={<Building2 size={14} />} />
          <KpiCard label="With dues" value={String(withDues)} hint="owe you money" tone="danger" />
          <KpiCard label="Total dues" value={rupees(outstanding)} hint="receivable" tone="accent" />
          <KpiCard label="Rate contracts" value={String(customers.filter((c) => c.ratePerKmPaise > 0).length)} hint="agreed ₹/km" tone="success" icon={<Receipt size={14} />} />
        </section>

        <Card>
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3">
            <h3 className="text-sm font-semibold text-neutral-800">Customer directory</h3>
            <Button size="sm" onClick={() => setOpen(true)}><Plus size={13} /> Add customer</Button>
          </div>
          <Table>
            <THead>
              <Tr><Th>Company</Th><Th>GSTIN</Th><Th>City</Th><Th className="text-right">Rate ₹/km</Th><Th className="text-right">Outstanding</Th><Th></Th></Tr>
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
                  <Td><button className="text-xs font-bold text-primary-600 hover:text-primary-700">Ledger</button></Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Card>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add customer" subtitle="A consignor you bill" onSubmit={submit} submitLabel="Add customer" submitDisabled={!valid}>
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
    </PartnerLayout>
  );
}
