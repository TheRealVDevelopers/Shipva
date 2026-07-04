import { Plus, Download, Send } from 'lucide-react';
import { PartnerLayout } from '../../components/layout/PartnerLayout.js';
import { Card, CardHeader, CardBody } from '../../components/ui/Card.js';
import { KpiCard } from '../../components/ui/KpiCard.js';
import { Table, THead, Th, TBody, Tr, Td } from '../../components/ui/Table.js';
import { Badge, type BadgeTone } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { HBar } from '../../components/ui/Charts.js';
import { rupees } from '../../lib/format.js';
import { invoices, receivables, type InvoiceStatus } from '../../lib/mocks.js';

const INV_BADGE: Record<InvoiceStatus, { label: string; tone: BadgeTone }> = {
  paid: { label: 'Paid', tone: 'success' },
  pending: { label: 'Pending', tone: 'warning' },
  overdue: { label: 'Overdue', tone: 'danger' },
};

export function Invoices() {
  const paid = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.totalPaise, 0);
  const overdue = invoices.filter((i) => i.status === 'overdue').reduce((s, i) => s + i.totalPaise, 0);
  const gstMtd = invoices.reduce((s, i) => s + i.gstPaise, 0);

  return (
    <PartnerLayout title="Invoices" subtitle="GST billing & receivables">
      <div className="space-y-6">
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Outstanding" value={rupees(receivables.outstandingPaise)} hint="to collect" tone="danger" />
          <KpiCard label="Collected · MTD" value={rupees(receivables.collectedMtdPaise)} hint="received" tone="success" />
          <KpiCard label="Overdue" value={rupees(overdue)} hint="past due date" tone="accent" />
          <KpiCard label="GST · MTD" value={rupees(gstMtd)} hint="output tax" tone="primary" />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader
              title="Invoices"
              subtitle="Raise GST-compliant invoices per trip"
              action={<Button size="sm"><Plus size={13} /> New invoice</Button>}
            />
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
                      <div className="flex items-center gap-1.5 text-neutral-400">
                        <button className="hover:text-primary-600" title="Download PDF"><Download size={14} /></button>
                        {i.status !== 'paid' && <button className="hover:text-primary-600" title="Send reminder"><Send size={14} /></button>}
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
    </PartnerLayout>
  );
}
