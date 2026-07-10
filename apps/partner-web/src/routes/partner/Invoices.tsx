import { useState } from 'react';
import { Plus, Download, Send, IndianRupee } from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card, CardHeader, CardBody } from '../../components/ui/Card.js';
import { KpiCard } from '../../components/ui/KpiCard.js';
import { Table, THead, Th, TBody, Tr, Td } from '../../components/ui/Table.js';
import { Badge, type BadgeTone } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Modal, Field, TextInput, Select, Row } from '../../components/ui/Modal.js';
import { HBar } from '../../components/ui/Charts.js';
import { rupees } from '../../lib/format.js';
import { receivables, type InvoiceStatus } from '../../lib/mocks.js';
import { useStore, todayLabel } from '../../lib/store.js';
import { useNotify } from '../../lib/notify.js';

const INV_BADGE: Record<InvoiceStatus, { label: string; tone: BadgeTone }> = {
  paid: { label: 'Paid', tone: 'success' },
  pending: { label: 'Pending', tone: 'warning' },
  overdue: { label: 'Overdue', tone: 'danger' },
};

const EMPTY = { client: '', base: '', gstRate: '18' };
const dueLabel = () => new Date(Date.now() + 15 * 864e5).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

export function Invoices() {
  const { invoices, customers, addInvoice, markInvoicePaid } = useStore();
  const { push } = useNotify();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(EMPTY);

  function payInvoice(no: string, client: string, total: number) {
    markInvoicePaid(no);
    push({ title: 'Payment received', body: `${client} paid ${rupees(total)} against ${no}.`, tone: 'success' });
  }

  const paid = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.totalPaise, 0);
  const overdue = invoices.filter((i) => i.status === 'overdue').reduce((s, i) => s + i.totalPaise, 0);
  const gstMtd = invoices.reduce((s, i) => s + i.gstPaise, 0);
  const valid = f.client && Number(f.base) > 0;

  function submit() {
    if (!valid) return;
    addInvoice({ client: f.client, date: todayLabel(), dueDate: dueLabel(), basePaise: Math.round(Number(f.base) * 100), status: 'pending', gstRate: Number(f.gstRate) });
    setF(EMPTY); setOpen(false);
  }

  return (
    <PartnerLayout title="Invoices" subtitle="GST billing & receivables">
      <div className="space-y-6">
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Outstanding" value={rupees(receivables.outstandingPaise)} hint="to collect" tone="danger" />
          <KpiCard label="Collected · MTD" value={rupees(receivables.collectedMtdPaise)} hint="received" tone="success" />
          <KpiCard label="Overdue" value={rupees(overdue)} hint="past due date" tone="accent" />
          <KpiCard label="GST · output" value={rupees(gstMtd)} hint="on invoices" tone="primary" />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader title="Invoices" subtitle="GST-compliant, per trip/client" action={<Button size="sm" onClick={() => setOpen(true)}><Plus size={13} /> New invoice</Button>} />
            <Table>
              <THead>
                <Tr>
                  <Th>Invoice</Th><Th>Client</Th><Th>Dates</Th>
                  <Th className="text-right">Base</Th><Th className="text-right">GST</Th><Th className="text-right">Total</Th>
                  <Th>Status</Th><Th></Th>
                </Tr>
              </THead>
              <TBody>
                {invoices.map((i) => (
                  <Tr key={i.no}>
                    <Td className="font-mono text-xs font-bold text-neutral-900">{i.no}</Td>
                    <Td className="font-semibold text-neutral-800">{i.client}</Td>
                    <Td className="text-[11px] text-neutral-500">{i.date}<div className="text-neutral-400">due {i.dueDate}</div></Td>
                    <Td className="text-right text-neutral-600">{rupees(i.basePaise)}</Td>
                    <Td className="text-right text-neutral-600">{rupees(i.gstPaise)}</Td>
                    <Td className="text-right font-bold text-neutral-900">{rupees(i.totalPaise)}</Td>
                    <Td><Badge tone={INV_BADGE[i.status].tone}>{INV_BADGE[i.status].label}</Badge></Td>
                    <Td>
                      <div className="flex items-center gap-2 text-neutral-400">
                        <button className="hover:text-primary-600" title="Download PDF"><Download size={14} /></button>
                        {i.status !== 'paid' && (
                          <>
                            <button className="hover:text-primary-600" title="Send reminder"><Send size={14} /></button>
                            <button onClick={() => payInvoice(i.no, i.client, i.totalPaise)} className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700">Mark paid</button>
                          </>
                        )}
                      </div>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </Card>

          <Card>
            <CardHeader title="Receivables aging" subtitle="Outstanding by age" />
            <CardBody className="space-y-3">
              {receivables.aging.map((a) => {
                const color = { success: '#10b981', warning: '#f59e0b', accent: 'var(--sx-accent-500)', danger: '#f43f5e' }[a.tone];
                return (
                  <div key={a.bucket}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-neutral-700">{a.bucket}</span>
                      <span className="font-bold text-neutral-900">{rupees(a.amountPaise)}</span>
                    </div>
                    <div className="mt-1"><HBar value={a.amountPaise} max={receivables.outstandingPaise} color={color} /></div>
                  </div>
                );
              })}
              <div className="mt-2 flex items-center justify-between border-t border-neutral-100 pt-3 text-sm">
                <span className="font-semibold text-neutral-700">Total outstanding</span>
                <span className="font-extrabold text-neutral-900">{rupees(receivables.outstandingPaise)}</span>
              </div>
              <div className="rounded-lg bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800 ring-1 ring-inset ring-emerald-100">
                Paid to date this month: {rupees(paid)}. Send reminders on overdue invoices to speed up collection.
              </div>
            </CardBody>
          </Card>
        </section>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New invoice" subtitle="GST is auto-calculated" onSubmit={submit} submitLabel="Create invoice" submitDisabled={!valid}>
        <Field label="Client">
          <Select value={f.client} onChange={(e) => setF({ ...f, client: e.target.value })}>
            <option value="">Select client</option>
            {customers.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </Select>
        </Field>
        <Row>
          <Field label="Base amount (₹)"><TextInput type="number" value={f.base} onChange={(e) => setF({ ...f, base: e.target.value })} placeholder="52000" /></Field>
          <Field label="GST rate">
            <Select value={f.gstRate} onChange={(e) => setF({ ...f, gstRate: e.target.value })}>
              <option value="5">5%</option><option value="12">12%</option><option value="18">18%</option>
            </Select>
          </Field>
        </Row>
        {Number(f.base) > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-sm ring-1 ring-inset ring-neutral-200">
            <span className="flex items-center gap-1 text-neutral-600"><IndianRupee size={13} /> Total incl. GST</span>
            <span className="font-extrabold text-neutral-900">{rupees(Math.round(Number(f.base) * 100 * (1 + Number(f.gstRate) / 100)))}</span>
          </div>
        )}
      </Modal>
    </PartnerLayout>
  );
}
